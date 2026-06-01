import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/PageHeader";
import { Progress } from "@/components/ui/progress";
import { Package, AlertTriangle, Layers, Layers3, Loader2, Plus, X, Search, Edit2, Trash, Eye } from "lucide-react";
import { inventario as inventarioApi, default as api } from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/inventario")({
  component: InventarioPage,
  head: () => ({ meta: [{ title: "Inventario — CortinaSys" }] }),
});

function InventarioPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterQuery, setFilterQuery] = useState("");
  const [nuevoMaterial, setNuevoMaterial] = useState({
    nombre: "",
    unidad: "Unidades",
    stock_actual: 0,
    stock_minimo: 10,
    proveedor: "",
    precio_unitario: 0
  });

  const { data: inventarioData = [], isLoading } = useQuery({
    queryKey: ["inventario", filterQuery],
    queryFn: () => inventarioApi.listar(), // El backend actual no filtra por query en el endpoint principal, lo haremos en el frontend o ajustaremos el backend si es necesario
  });

  // Filtrado en el frontend para respuesta inmediata
  const filteredData = inventarioData.filter((m: any) => 
    m.nombre.toLowerCase().includes(filterQuery.toLowerCase()) ||
    m.proveedor?.toLowerCase().includes(filterQuery.toLowerCase())
  );

  const handleSearch = () => {
    setFilterQuery(searchTerm);
  };

  const mutation = useMutation({
    mutationFn: (data: any) => api.post("/inventario/", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventario"] });
      toast.success("Producto agregado al inventario");
      setOpen(false);
      setNuevoMaterial({
        nombre: "",
        unidad: "Unidades",
        stock_actual: 0,
        stock_minimo: 10,
        proveedor: "",
        precio_unitario: 0
      });
    },
    onError: () => {
      toast.error("Error al agregar el producto");
    }
  });

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(nuevoMaterial);
  };

  const totalInsumos = inventarioData.length;
  const alertasCriticas = inventarioData.filter((m: any) => m.stock_actual <= m.stock_minimo).length;
  const lotesEstables = totalInsumos - alertasCriticas;

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Almacén Central" 
        description="Panel visual de niveles de materia prima y control de suministros" 
      />

      {/* Grid Superior: Módulos de Estado y Control Rápido */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* Tarjetas de Métricas Rediseñadas (Slim & Modern) */}
        <div className="xl:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="shadow-elegant border-b-4 border-b-primary bg-gradient-to-br from-background to-muted/20">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Insumos</span>
                <p className="text-3xl font-black text-foreground">{totalInsumos}</p>
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
                <p className="text-3xl font-black text-destructive">{alertasCriticas}</p>
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
                <p className="text-3xl font-black text-success">{lotesEstables}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-success/10 flex items-center justify-center border border-success/20">
                <Layers className="h-5 w-5 text-success" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Botón de acción / Filtro Rápido */}
        <div className="flex items-center justify-end gap-2">
          <div className="flex items-center gap-2 bg-muted/30 p-1 rounded-lg border border-border/40">
            <Input 
              placeholder="Buscar insumo..." 
              className="h-8 w-48 bg-transparent border-0 focus-visible:ring-0 text-xs" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleSearch}>
              <Search className="h-4 w-4" />
            </Button>
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-xs gap-1.5 shadow-elegant">
                <Plus className="h-4 w-4" /> Agregar Producto
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Agregar nuevo material</DialogTitle>
                <CardDescription>Completa los datos para registrar un nuevo insumo en el almacén.</CardDescription>
              </DialogHeader>
              <form onSubmit={handleAddProduct} className="space-y-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="nombre" className="text-right">Nombre</Label>
                  <Input 
                    id="nombre" 
                    className="col-span-3" 
                    value={nuevoMaterial.nombre}
                    onChange={(e) => setNuevoMaterial({...nuevoMaterial, nombre: e.target.value})}
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="proveedor" className="text-right">Proveedor</Label>
                  <Input 
                    id="proveedor" 
                    className="col-span-3" 
                    value={nuevoMaterial.proveedor}
                    onChange={(e) => setNuevoMaterial({...nuevoMaterial, proveedor: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="unidad" className="text-right">Unidad</Label>
                  <select 
                    id="unidad"
                    className="col-span-3 h-10 rounded-md border bg-background px-3 text-sm"
                    value={nuevoMaterial.unidad}
                    onChange={(e) => setNuevoMaterial({...nuevoMaterial, unidad: e.target.value})}
                  >
                    <option>Unidades</option>
                    <option>Metros</option>
                    <option>Rollos</option>
                    <option>Kilos</option>
                  </select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="stock" className="text-right">Stock Inicial</Label>
                  <Input 
                    id="stock" 
                    type="number"
                    className="col-span-3" 
                    value={nuevoMaterial.stock_actual}
                    onChange={(e) => setNuevoMaterial({...nuevoMaterial, stock_actual: parseFloat(e.target.value)})}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="minimo" className="text-right">Mínimo</Label>
                  <Input 
                    id="minimo" 
                    type="number"
                    className="col-span-3" 
                    value={nuevoMaterial.stock_minimo}
                    onChange={(e) => setNuevoMaterial({...nuevoMaterial, stock_minimo: parseFloat(e.target.value)})}
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" className="gradient-primary w-full" disabled={mutation.isPending}>
                    {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Guardar Producto
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          
          <Badge className="bg-accent/10 text-accent hover:bg-accent/20 border border-accent/30 text-xs px-3 py-1.5 rounded-lg cursor-pointer font-medium gap-1.5 h-10">
            <Layers3 className="h-3.5 w-3.5" /> Ver Todo
          </Badge>
        </div>
      </div>

      {/* Área de Contenido Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LADO IZQUIERDO: Tarjetas de Materiales Dinámicas */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Monitor de Capacidad</h3>
            <span className="text-xs text-muted-foreground">Estado actual del stock vs mínimos</span>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredData.map((m: any) => {
                const esCritico = m.stock_actual <= m.stock_minimo;
                const porcentajeCarga = Math.min(100, Math.round((m.stock_actual / (m.stock_minimo * 3)) * 100));

                return (
                  <Card key={m.id} className={`shadow-elegant transition-all duration-300 hover:scale-[1.01] ${esCritico ? "border-destructive/30" : "border-border"}`}>
                    <CardContent className="p-5 space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-tight">{m.proveedor || "Insumo"}</p>
                          <h4 className="text-lg font-black text-foreground">{m.nombre}</h4>
                        </div>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-accent">
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive">
                            <Trash className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-muted-foreground">Stock Actual</span>
                          <span className={esCritico ? "text-destructive" : "text-accent"}>{m.stock_actual} {m.unidad}</span>
                        </div>
                        <Progress value={porcentajeCarga} className={`h-2.5 ${esCritico ? "bg-destructive/10" : "bg-muted"}`} />
                        <div className="flex justify-between text-[10px] font-bold text-muted-foreground/60">
                          <span>0</span>
                          <span>Capacidad Recomendada: {m.stock_minimo * 3}</span>
                        </div>
                      </div>

                      <div className="pt-2 flex gap-2">
                        <div className="flex-1 bg-muted/30 rounded-lg p-2 text-center">
                          <p className="text-[10px] text-muted-foreground uppercase font-bold">Mínimo</p>
                          <p className="text-sm font-black">{m.stock_minimo}</p>
                        </div>
                        <div className="flex-1 bg-muted/30 rounded-lg p-2 text-center">
                          <p className="text-[10px] text-muted-foreground uppercase font-bold">Unidad</p>
                          <p className="text-sm font-black">{m.unidad}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* LADO DERECHO: Historial y Órdenes de Compra Sugeridas */}
        <div className="space-y-6">
          <Card className="shadow-elegant overflow-hidden border-none ring-1 ring-border">
            <CardHeader className="bg-muted/30 pb-4">
              <CardTitle className="text-sm">Reposición Sugerida</CardTitle>
              <CardDescription className="text-xs">Sugerencias basadas en el stock actual</CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {inventarioData.filter((m: any) => m.stock_actual <= m.stock_minimo).map((m: any) => (
                <div key={m.id} className="group p-3 rounded-xl border border-border bg-background hover:bg-muted/20 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate">{m.nombre}</p>
                      <p className="text-[10px] text-muted-foreground font-medium">Faltan {(m.stock_minimo * 1.5 - m.stock_actual).toFixed(0)} para nivel seguro</p>
                    </div>
                  </div>
                </div>
              ))}
              {alertasCriticas === 0 && (
                <div className="text-center py-6 text-xs text-muted-foreground italic">
                  Todo el inventario está en niveles seguros.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
