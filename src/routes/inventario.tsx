import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/PageHeader";
import { Progress } from "@/components/ui/progress";
import { Package, AlertTriangle, Layers, Layers3, ArrowUpRight, Plus, Loader2 } from "lucide-react";
import api from "@/lib/api";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/inventario")({
  component: InventarioPage,
  head: () => ({ meta: [{ title: "Inventario — CortinaSys" }] }),
});

function InventarioPage() {
  const queryClient = useQueryClient();
  const [ajuste, setAjuste] = useState({ materialId: "", cantidad: 0 });
  const [nuevoMaterial, setNuevoMaterial] = useState({
    nombre: "",
    stock_actual: 0,
    stock_minimo: 10,
    unidad: "Metros",
    precio_unitario: 0,
    proveedor: "",
  });

  const { data: materiales, isLoading: loadingMateriales } = useQuery({
    queryKey: ["materiales"],
    queryFn: () => api.inventario.listar(),
  });

  const { data: resumen, isLoading: loadingResumen } = useQuery({
    queryKey: ["inventario-resumen-page"],
    queryFn: () => api.inventario.resumen(),
  });

  const ajustarStockMutation = useMutation({
    mutationFn: ({ id, cantidad }: { id: number; cantidad: number }) => 
      api.inventario.ajustarStock(id, cantidad),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materiales"] });
      queryClient.invalidateQueries({ queryKey: ["inventario-resumen-page"] });
      queryClient.invalidateQueries({ queryKey: ["kpis"] });
      toast.success("Stock actualizado correctamente");
      setAjuste({ materialId: "", cantidad: 0 });
    },
    onError: (error: Error) => toast.error(`Error: ${error.message}`),
  });

  const crearMaterialMutation = useMutation({
    mutationFn: (data: any) => api.inventario.crear(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materiales"] });
      queryClient.invalidateQueries({ queryKey: ["inventario-resumen-page"] });
      toast.success("Material registrado correctamente");
      setNuevoMaterial({
        nombre: "",
        stock_actual: 0,
        stock_minimo: 10,
        unidad: "Metros",
        precio_unitario: 0,
        proveedor: "",
      });
    },
    onError: (error: Error) => toast.error(`Error: ${error.message}`),
  });

  const handleAjustarStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ajuste.materialId || ajuste.cantidad === 0) {
      toast.error("Seleccione un material y una cantidad válida");
      return;
    }
    ajustarStockMutation.mutate({ 
      id: parseInt(ajuste.materialId), 
      cantidad: ajuste.cantidad 
    });
  };

  const handleCrearMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoMaterial.nombre) {
      toast.error("El nombre del material es obligatorio");
      return;
    }
    crearMaterialMutation.mutate(nuevoMaterial);
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Almacén Central" 
        description="Panel visual de niveles de materia prima y control de suministros" 
      />

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="shadow-elegant border-b-4 border-b-primary bg-gradient-to-br from-background to-muted/20">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Insumos</span>
                <p className="text-3xl font-black text-foreground">
                  {loadingResumen ? <Loader2 className="h-6 w-6 animate-spin" /> : resumen?.total_materiales || 0}
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                <Package className="h-5 w-5 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-elegant border-b-4 border-b-destructive bg-gradient-to-br from-background to-destructive/5">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs text-destructive font-medium uppercase tracking-wider">Alertas Críticas</span>
                <p className="text-3xl font-black text-destructive">
                  {loadingResumen ? <Loader2 className="h-6 w-6 animate-spin" /> : resumen?.stock_critico || 0}
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center border border-destructive/20">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-elegant border-b-4 border-b-success bg-gradient-to-br from-background to-success/5">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs text-success font-medium uppercase tracking-wider">Lotes Estables</span>
                <p className="text-3xl font-black text-success">
                  {loadingResumen ? <Loader2 className="h-6 w-6 animate-spin" /> : (resumen?.total_materiales || 0) - (resumen?.stock_critico || 0)}
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-success/10 flex items-center justify-center border border-success/20">
                <Layers className="h-5 w-5 text-success" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center justify-end">
          <Badge className="bg-accent/10 text-accent hover:bg-accent/20 border border-accent/30 text-xs px-3 py-1.5 rounded-lg cursor-pointer font-medium gap-1.5">
            <Layers3 className="h-3.5 w-3.5" /> Ver Todo el Almacén
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Monitor de Capacidad</h3>
            <span className="text-xs text-muted-foreground">Estado actual frente al stock mínimo</span>
          </div>

          {loadingMateriales ? (
            <div className="flex justify-center py-12"><Loader2 className="h-12 w-12 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {materiales?.map((m) => {
                const esCritico = m.stock_critico;
                // Calculamos porcentaje basado en el doble del mínimo como "capacidad ideal" para el gráfico
                const maxReferencia = m.stock_minimo * 3;
                const porcentajeCarga = Math.min(100, Math.round((m.stock_actual / maxReferencia) * 100));

                return (
                  <Card key={m.id} className="shadow-elegant border border-border/60 hover:border-border transition-all duration-200">
                    <CardContent className="p-5 space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-mono text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded">
                            ID: {m.id}
                          </span>
                          <h4 className="font-bold text-foreground text-md mt-1">{m.nombre}</h4>
                        </div>
                        <Badge className={esCritico ? "bg-destructive/15 text-destructive border-0" : "bg-success/15 text-success border-0"}>
                          {esCritico ? "Stock Crítico" : "Óptimo"}
                        </Badge>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-muted-foreground">Disponibilidad</span>
                          <span className={esCritico ? "text-destructive font-bold" : "text-primary font-bold"}>
                            {m.stock_actual} {m.unidad}
                          </span>
                        </div>
                        <Progress 
                          value={porcentajeCarga} 
                          className="h-2 bg-muted"
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-muted-foreground bg-muted/30 p-2 rounded-md border border-border/40">
                        <span>Mínimo de Resguardo:</span>
                        <span className="font-semibold text-foreground font-mono">{m.stock_minimo} {m.unidad}</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <Card className="shadow-elegant border-t-4 border-t-accent">
            <CardHeader className="pb-4">
              <CardTitle className="text-md font-bold flex items-center gap-2">
                <Plus className="h-4 w-4 text-accent" /> Consola Logística
              </CardTitle>
              <CardDescription>Ejecuta flujos e ingresos al almacén</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="abastecer" className="w-full">
                <TabsList className="grid grid-cols-2 w-full mb-4 bg-muted/60 p-1 rounded-lg">
                  <TabsTrigger value="abastecer" className="text-xs">Abastecer</TabsTrigger>
                  <TabsTrigger value="crear" className="text-xs">Nuevo Insumo</TabsTrigger>
                </TabsList>

                <TabsContent value="abastecer" className="space-y-4">
                  <form onSubmit={handleAjustarStock} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-muted-foreground">Seleccionar Material Activo</Label>
                      <select 
                        className="w-full h-10 rounded-md border bg-background px-3 text-sm focus:ring-2 focus:ring-accent outline-none"
                        value={ajuste.materialId}
                        onChange={(e) => setAjuste({ ...ajuste, materialId: e.target.value })}
                      >
                        <option value="">Buscar en inventario...</option>
                        {materiales?.map((m) => (
                          <option key={m.id} value={m.id}>{m.nombre} ({m.stock_actual} {m.unidad})</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-muted-foreground">Volumen de Entrada/Salida</Label>
                      <Input 
                        type="number" 
                        placeholder="Ej. 150 (negativo para salida)" 
                        className="h-10" 
                        value={ajuste.cantidad}
                        onChange={(e) => setAjuste({ ...ajuste, cantidad: parseFloat(e.target.value) })}
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full gradient-primary gap-2 h-10 text-sm font-medium"
                      disabled={ajustarStockMutation.isPending}
                    >
                      {ajustarStockMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Registrar Ajuste"} 
                      <ArrowUpRight className="h-4 w-4" />
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="crear" className="space-y-4">
                  <form onSubmit={handleCrearMaterial} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-muted-foreground">Nombre del Insumo</Label>
                      <Input 
                        placeholder="Ej. Tela Blackout Premium" 
                        className="h-10" 
                        value={nuevoMaterial.nombre}
                        onChange={(e) => setNuevoMaterial({ ...nuevoMaterial, nombre: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-muted-foreground">Stock Inicial</Label>
                        <Input 
                          type="number" 
                          placeholder="0" 
                          className="h-10" 
                          value={nuevoMaterial.stock_actual}
                          onChange={(e) => setNuevoMaterial({ ...nuevoMaterial, stock_actual: parseFloat(e.target.value) })}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-muted-foreground">Stock Mínimo</Label>
                        <Input 
                          type="number" 
                          placeholder="10" 
                          className="h-10" 
                          value={nuevoMaterial.stock_minimo}
                          onChange={(e) => setNuevoMaterial({ ...nuevoMaterial, stock_minimo: parseFloat(e.target.value) })}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-muted-foreground">Unidad</Label>
                        <Input 
                          placeholder="Ej. Metros" 
                          className="h-10" 
                          value={nuevoMaterial.unidad}
                          onChange={(e) => setNuevoMaterial({ ...nuevoMaterial, unidad: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-muted-foreground">Precio Unit.</Label>
                        <Input 
                          type="number" 
                          placeholder="0.00" 
                          className="h-10" 
                          value={nuevoMaterial.precio_unitario}
                          onChange={(e) => setNuevoMaterial({ ...nuevoMaterial, precio_unitario: parseFloat(e.target.value) })}
                        />
                      </div>
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full gradient-accent gap-2 h-10 text-sm font-medium"
                      disabled={crearMaterialMutation.isPending}
                    >
                      {crearMaterialMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Crear Material"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}