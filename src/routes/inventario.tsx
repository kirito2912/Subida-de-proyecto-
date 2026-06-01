import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/PageHeader";
import { Progress } from "@/components/ui/progress";
import { Package, AlertTriangle, Layers, Layers3, Loader2 } from "lucide-react";
import { inventario as inventarioApi } from "@/lib/api";

export const Route = createFileRoute("/inventario")({
  component: InventarioPage,
  head: () => ({ meta: [{ title: "Inventario — CortinaSys" }] }),
});

function InventarioPage() {
  const { data: inventarioData = [], isLoading } = useQuery({
    queryKey: ["inventario"],
    queryFn: inventarioApi.listar,
  });

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
        <div className="flex items-center justify-end">
          <Badge className="bg-accent/10 text-accent hover:bg-accent/20 border border-accent/30 text-xs px-3 py-1.5 rounded-lg cursor-pointer font-medium gap-1.5">
            <Layers3 className="h-3.5 w-3.5" /> Ver Todo el Almacén
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
              {inventarioData.map((m: any) => {
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
                        <Badge className={`${esCritico ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success"} border-0`}>
                          {esCritico ? "Crítico" : "Estable"}
                        </Badge>
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
