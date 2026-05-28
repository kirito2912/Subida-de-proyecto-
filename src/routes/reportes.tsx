import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, BarChart3, ShieldAlert, CalendarDays, Clock, AlertTriangle, PieChart, Layers, CheckCircle2, Activity, Loader2 } from "lucide-react";
import api from "@/lib/api";
import { useState } from "react";

export const Route = createFileRoute("/reportes")({
  component: ReportesPage,
  head: () => ({ meta: [{ title: "Reportes Consolidados " }] }),
});

function ReportesPage() {
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [mes, setMes] = useState(new Date().getMonth() + 1);

  const { data: reporteComercial, isLoading: loadingComercial } = useQuery({
    queryKey: ["reporte-ventas", anio, mes],
    queryFn: () => api.reportes.ventas(anio, mes),
  });

  const { data: reportePlanta, isLoading: loadingPlanta } = useQuery({
    queryKey: ["reporte-produccion", anio, mes],
    queryFn: () => api.reportes.produccion(anio, mes),
  });

  const { data: reporteCalidad, isLoading: loadingCalidad } = useQuery({
    queryKey: ["reporte-quejas"],
    queryFn: () => api.reportes.quejas(),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b pb-5 border-border/60">
        <PageHeader 
          title="Reportes de pedidos" 
          description="Auditoría avanzada y balances analíticos calculados por el servidor " 
        />
        
        <div className="flex items-center gap-2 bg-muted/60 p-1.5 rounded-xl border text-xs font-semibold h-fit">
          <CalendarDays className="h-4 w-4 text-muted-foreground ml-1" />
          <select 
            className="bg-background rounded-lg border px-2.5 py-1.5 outline-none font-semibold"
            value={anio}
            onChange={(e) => setAnio(parseInt(e.target.value))}
          >
            <option value={2026}>Año 2026</option>
            <option value={2025}>Año 2025</option>
          </select>
          <select 
            className="bg-background rounded-lg border px-2.5 py-1.5 outline-none font-semibold"
            value={mes}
            onChange={(e) => setMes(parseInt(e.target.value))}
          >
            <option value={0}>Todo el Año (Acumulado)</option>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => (
              <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('es', { month: 'long' })}</option>
            ))}
          </select>
        </div>
      </div>

      <Tabs defaultValue="comercial" className="w-full space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-2xl bg-muted/80 p-1 rounded-2xl border shadow-inner gap-1">
          <TabsTrigger value="comercial" className="text-xs font-black tracking-wide uppercase py-2.5 rounded-xl data-[state=active]:shadow-elegant gap-2">
            <DollarSign className="h-4 w-4 text-success" /> Balance Comercial
          </TabsTrigger>
          <TabsTrigger value="planta" className="text-xs font-black tracking-wide uppercase py-2.5 rounded-xl data-[state=active]:shadow-elegant gap-2">
            <BarChart3 className="h-4 w-4 text-primary" /> Flujo de Planta
          </TabsTrigger>
          <TabsTrigger value="calidad" className="text-xs font-black tracking-wide uppercase py-2.5 rounded-xl data-[state=active]:shadow-elegant gap-2">
            <ShieldAlert className="h-4 w-4 text-destructive" /> Control de Calidad
          </TabsTrigger>
        </TabsList>

        <TabsContent value="comercial" className="space-y-6 animate-fade-in">
          {loadingComercial ? (
            <div className="flex justify-center py-12"><Loader2 className="h-12 w-12 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="shadow-elegant border-none bg-gradient-to-br from-success/15 via-background to-muted/40 overflow-hidden relative group">
                <div className="absolute -right-6 -bottom-6 opacity-5 text-success group-hover:scale-110 transition-transform duration-300">
                  <DollarSign className="h-40 w-40" />
                </div>
                <CardContent className="p-6 space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Monto Facturado Neto</p>
                      <p className="text-3xl font-black text-foreground mt-1 font-mono">Bs. {reporteComercial?.total_monto?.toLocaleString()}</p>
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-success/10 flex items-center justify-center text-success border border-success/20 shadow-sm">
                      <DollarSign className="h-5 w-5" />
                    </div>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-background/60 backdrop-blur-sm p-3 rounded-xl border border-border/40">
                      <p className="text-[10px] text-muted-foreground font-semibold uppercase">Órdenes Registradas</p>
                      <p className="text-lg font-extrabold text-foreground font-mono mt-0.5">{reporteComercial?.total_pedidos}</p>
                    </div>
                    <div className="bg-background/60 backdrop-blur-sm p-3 rounded-xl border border-border/40">
                      <p className="text-[10px] text-muted-foreground font-semibold uppercase">Filtro Backend</p>
                      <p className="text-xs font-bold text-accent font-mono mt-1.5 truncate">{reporteComercial?.periodo}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-elegant border-none bg-card/60 backdrop-blur-md p-5 flex flex-col justify-between">
                <div className="flex items-center gap-2 pb-2 border-b border-border/40">
                  <div className="p-1.5 rounded-lg bg-accent/10 text-accent">
                    <PieChart className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground">Distribución por Modelos</h4>
                    <p className="text-[10px] text-muted-foreground font-mono">Volumen físico</p>
                  </div>
                </div>
                <div className="space-y-3.5 pt-4">
                  {Object.entries(reporteComercial?.por_tipo || {}).map(([tipo, cant]: [string, any]) => (
                    <div key={tipo} className="space-y-1.5 group cursor-pointer">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-muted-foreground group-hover:text-foreground transition-colors font-semibold">{tipo}</span>
                        <span className="font-mono font-bold text-foreground bg-muted px-2 py-0.5 rounded text-[11px]">{cant} unds</span>
                      </div>
                      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden border border-border/10">
                        <div className="h-full bg-accent rounded-full transition-all group-hover:bg-primary" style={{ width: `${(cant / (reporteComercial?.total_pedidos || 1)) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="shadow-elegant border-none bg-card/40 backdrop-blur-md p-5 flex flex-col justify-between">
                <div className="flex items-center gap-2 pb-2 border-b border-border/40">
                  <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                    <Layers className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground">Estado de Órdenes</h4>
                    <p className="text-[10px] text-muted-foreground font-mono">Estatus actual</p>
                  </div>
                </div>
                <div className="space-y-3 pt-4">
                  {Object.entries(reporteComercial?.por_estado || {}).map(([estado, cant]: [string, any]) => {
                    const esEntregado = estado === "Entregado";
                    return (
                      <div key={estado} className="flex justify-between items-center bg-gradient-to-r from-background to-muted/30 p-3.5 rounded-xl border border-border/40 relative group hover:shadow-sm transition-all">
                        <div className={`absolute top-0 left-0 w-1 h-full rounded-l-xl ${esEntregado ? "bg-success" : "bg-warning"}`} />
                        <div className="flex items-center gap-2 pl-2">
                          {esEntregado ? <CheckCircle2 className="h-4 w-4 text-success" /> : <Clock className="h-4 w-4 text-warning" />}
                          <span className="font-bold text-xs text-foreground">{estado}</span>
                        </div>
                        <Badge variant="outline" className="font-mono text-xs bg-background text-foreground border-border/60 px-2 py-0.5 font-bold">
                          {cant} pedidos
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="planta" className="space-y-6 animate-fade-in">
          {loadingPlanta ? (
            <div className="flex justify-center py-12"><Loader2 className="h-12 w-12 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="shadow-elegant p-6 bg-gradient-to-br from-primary/10 to-background">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-muted-foreground uppercase">En Producción</span>
                  <Activity className="h-5 w-5 text-primary" />
                </div>
                <p className="text-4xl font-black">{reportePlanta?.total_en_proceso || 0}</p>
                <p className="text-xs text-muted-foreground mt-2">Órdenes activas en taller</p>
              </Card>

              <Card className="shadow-elegant p-6 bg-gradient-to-br from-success/10 to-background">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-muted-foreground uppercase">Entregados</span>
                  <CheckCircle2 className="h-5 w-5 text-success" />
                </div>
                <p className="text-4xl font-black">{reportePlanta?.total_entregados || 0}</p>
                <p className="text-xs text-muted-foreground mt-2">Órdenes completadas este periodo</p>
              </Card>

              <Card className="shadow-elegant p-6 bg-gradient-to-br from-accent/10 to-background">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-muted-foreground uppercase">Lead Time Promedio</span>
                  <Clock className="h-5 w-5 text-accent" />
                </div>
                <p className="text-4xl font-black">{reportePlanta?.tiempo_promedio_dias || "N/A"}</p>
                <p className="text-xs text-muted-foreground mt-2">Días promedio por confección</p>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="calidad" className="space-y-6 animate-fade-in">
          {loadingCalidad ? (
            <div className="flex justify-center py-12"><Loader2 className="h-12 w-12 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="shadow-elegant p-6">
                <h4 className="text-sm font-bold uppercase mb-4 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" /> Resumen de Incidentes
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-destructive/10 rounded-xl">
                    <p className="text-2xl font-black text-destructive">{reporteCalidad?.abiertas}</p>
                    <p className="text-[10px] font-bold uppercase">Abiertas</p>
                  </div>
                  <div className="text-center p-3 bg-warning/10 rounded-xl">
                    <p className="text-2xl font-black text-warning-foreground">{reporteCalidad?.en_revision}</p>
                    <p className="text-[10px] font-bold uppercase">En Revisión</p>
                  </div>
                  <div className="text-center p-3 bg-success/10 rounded-xl">
                    <p className="text-2xl font-black text-success">{reporteCalidad?.resueltas}</p>
                    <p className="text-[10px] font-bold uppercase">Resueltas</p>
                  </div>
                </div>
              </Card>

              <Card className="shadow-elegant p-6">
                <h4 className="text-sm font-bold uppercase mb-4 flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-accent" /> Incidencias por Tipo
                </h4>
                <div className="space-y-3">
                  {Object.entries(reporteCalidad?.por_tipo || {}).map(([tipo, cant]: [string, any]) => (
                    <div key={tipo} className="flex justify-between items-center text-sm border-b pb-2">
                      <span className="text-muted-foreground">{tipo}</span>
                      <span className="font-bold">{cant} casos</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
