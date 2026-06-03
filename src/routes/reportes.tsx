import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, BarChart3, ShieldAlert, CalendarDays, Clock, AlertTriangle, PieChart, Layers, CheckCircle2, Activity, ArrowUpRight, Loader2 } from "lucide-react";
import api from "@/lib/api";

export const Route = createFileRoute("/reportes")({
  component: ReportesPage,
  head: () => ({ meta: [{ title: "Reportes Consolidados" }] }),
});

function ReportesPage() {
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [mes, setMes] = useState<number | undefined>(new Date().getMonth() + 1);

  // Queries para obtener datos reales del backend filtrados por fecha
  const { data: ventasData, isLoading: loadingVentas } = useQuery({
    queryKey: ["reporte-ventas", anio, mes],
    queryFn: () => api.get("/reportes/ventas", { params: { anio, mes } }).then(res => res.data),
  });

  const { data: produccionData, isLoading: loadingProduccion } = useQuery({
    queryKey: ["reporte-produccion", anio, mes],
    queryFn: () => api.get("/reportes/produccion", { params: { anio, mes } }).then(res => res.data),
  });

  const { data: quejasData, isLoading: loadingQuejas } = useQuery({
    queryKey: ["reporte-quejas"],
    queryFn: () => api.get("/reportes/quejas").then(res => res.data),
  });

  const isLoading = loadingVentas || loadingProduccion || loadingQuejas;

  return (
    <div className="space-y-6">
      
      {/* CABECERA CORREGIDA: Limpia, suelta y con línea divisoria como la página de Clientes */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b pb-5 border-border/60">
        <PageHeader 
          title="Reportes de pedidos" 
          description="Auditoría avanzada y balances analíticos calculados por el servidor" 
        />
        
        {/* FILTROS DE LA API MANTENIENDO EL ESTILO LIMPIO */}
        <div className="flex items-center gap-2 bg-muted/60 p-1.5 rounded-xl border text-xs font-semibold h-fit">
          <CalendarDays className="h-4 w-4 text-muted-foreground ml-1" />
          <select 
            className="bg-background rounded-lg border px-2.5 py-1.5 outline-none font-semibold"
            value={anio}
            onChange={(e) => setAnio(parseInt(e.target.value))}
          >
            <option value="2026">Año 2026</option>
            <option value="2025">Año 2025</option>
            <option value="2024">Año 2024</option>
          </select>
          <select 
            className="bg-background rounded-lg border px-2.5 py-1.5 outline-none font-semibold"
            value={mes || ""}
            onChange={(e) => setMes(e.target.value ? parseInt(e.target.value) : undefined)}
          >
            <option value="">Todo el Año (Acumulado)</option>
            <option value="1">Enero</option>
            <option value="2">Febrero</option>
            <option value="3">Marzo</option>
            <option value="4">Abril</option>
            <option value="5">Mayo</option>
            <option value="6">Junio</option>
            <option value="7">Julio</option>
            <option value="8">Agosto</option>
            <option value="9">Septiembre</option>
            <option value="10">Octubre</option>
            <option value="11">Noviembre</option>
            <option value="12">Diciembre</option>
          </select>
          {isLoading && <Loader2 className="h-4 w-4 animate-spin text-accent ml-2" />}
        </div>
      </div>

      {/* Tabs Principales de Enfoque */}
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

        {/* 1. COMPONENTE COMERCIAL */}
        <TabsContent value="comercial" className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* KPI de Montos Totales */}
            <Card className="shadow-elegant border-none bg-gradient-to-br from-success/15 via-background to-muted/40 overflow-hidden relative group">
              <div className="absolute -right-6 -bottom-6 opacity-5 text-success group-hover:scale-110 transition-transform duration-300">
                <DollarSign className="h-40 w-40" />
              </div>
              <CardContent className="p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Monto Facturado Neto</p>
                    <p className="text-3xl font-black text-foreground mt-1 font-mono">S/. {(ventasData?.total_monto ?? 0).toLocaleString()}</p>
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-success/10 flex items-center justify-center text-success border border-success/20 shadow-sm">
                    <DollarSign className="h-5 w-5" />
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-background/60 backdrop-blur-sm p-3 rounded-xl border border-border/40">
                    <p className="text-[10px] text-muted-foreground font-semibold uppercase">Órdenes Registradas</p>
                    <p className="text-lg font-extrabold text-foreground font-mono mt-0.5">{ventasData?.total_pedidos ?? 0}</p>
                  </div>
                  <div className="bg-background/60 backdrop-blur-sm p-3 rounded-xl border border-border/40">
                    <p className="text-[10px] text-muted-foreground font-semibold uppercase">Filtro Backend</p>
                    <p className="text-xs font-bold text-accent font-mono mt-1.5 truncate">{ventasData?.periodo ?? "--"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Distribución por Modelos (por_tipo) */}
            <Card className="shadow-elegant border-none bg-card/60 backdrop-blur-md p-5 flex flex-col justify-between">
              <div className="flex items-center gap-2 pb-2 border-b border-border/40">
                <div className="p-1.5 rounded-lg bg-accent/10 text-accent">
                  <PieChart className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground">Distribución por Modelos</h4>
                  <p className="text-[10px] text-muted-foreground font-mono">`por_tipo`</p>
                </div>
              </div>
              <div className="space-y-3.5 pt-4">
                {ventasData?.por_tipo && Object.entries(ventasData.por_tipo).length > 0 ? (
                  Object.entries(ventasData.por_tipo).map(([tipo, cant]: [string, any]) => (
                    <div key={tipo} className="space-y-1.5 group cursor-pointer">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-muted-foreground group-hover:text-foreground transition-colors font-semibold">{tipo}</span>
                        <span className="font-mono font-bold text-foreground bg-muted px-2 py-0.5 rounded text-[11px]">{cant} unds</span>
                      </div>
                      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden border border-border/10">
                        <div className="h-full bg-accent rounded-full transition-all group-hover:bg-primary" style={{ width: `${(cant / (ventasData.total_pedidos || 1)) * 100}%` }} />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-xs text-muted-foreground italic">No hay datos para este periodo</div>
                )}
              </div>
            </Card>

            {/* Distribución por Estado del Pedido (por_estado) */}
            <Card className="shadow-elegant border-none bg-card/40 backdrop-blur-md p-5 flex flex-col justify-between">
              <div className="flex items-center gap-2 pb-2 border-b border-border/40">
                <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                  <Layers className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground">Estado de Órdenes</h4>
                  <p className="text-[10px] text-muted-foreground font-mono">`por_estado`</p>
                </div>
              </div>
              <div className="space-y-3 pt-4">
                {ventasData?.por_estado && Object.entries(ventasData.por_estado).length > 0 ? (
                  Object.entries(ventasData.por_estado).map(([estado, cant]: [string, any]) => {
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
                  })
                ) : (
                  <div className="text-center py-8 text-xs text-muted-foreground italic">No hay datos para este periodo</div>
                )}
              </div>
            </Card>

          </div>
        </TabsContent>

        {/* 2. COMPONENTE DE PLANTA */}
        <TabsContent value="planta" className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <Card className="shadow-elegant border-none bg-card/40 backdrop-blur-md overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-4 opacity-5 text-warning group-hover:scale-110 transition-transform duration-200">
                <Clock className="h-20 w-20" />
              </div>
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Cola de Confección</span>
                  <Badge variant="outline" className="border-warning/30 text-warning bg-warning/5 font-mono text-[10px]">`total_en_proceso`</Badge>
                </div>
                <div>
                  <p className="text-4xl font-black font-mono text-foreground tracking-tight">{produccionData?.total_en_proceso ?? 0}</p>
                  <p className="text-xs font-semibold text-warning-foreground mt-1 flex items-center gap-1">
                    <Activity className="h-3 w-3 animate-pulse" /> Cortinas activas en mesas de taller
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-elegant border-none bg-card/40 backdrop-blur-md overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-4 opacity-5 text-success group-hover:scale-110 transition-transform duration-200">
                <CheckCircle2 className="h-20 w-20" />
              </div>
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Lotes Finalizados</span>
                  <Badge variant="outline" className="border-success/30 text-success bg-success/5 font-mono text-[10px]">`total_entregados`</Badge>
                </div>
                <div>
                  <p className="text-4xl font-black font-mono text-foreground tracking-tight">{produccionData?.total_entregados ?? 0}</p>
                  <p className="text-xs font-semibold text-success-foreground mt-1 flex items-center gap-1">
                    <ArrowUpRight className="h-3.5 w-3.5" /> Despachos completados en el periodo
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-elegant border-none bg-gradient-to-br from-primary/10 via-background to-muted/30 overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-4 opacity-5 text-primary group-hover:scale-110 transition-transform duration-200">
                <BarChart3 className="h-20 w-20" />
              </div>
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Velocidad de Respuesta</span>
                  <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5 font-mono text-[10px]">`tiempo_promedio_dias`</Badge>
                </div>
                <div>
                  <p className="text-4xl font-black font-mono text-foreground tracking-tight">
                    {produccionData?.tiempo_promedio_dias ?? "--"} <span className="text-sm font-medium text-muted-foreground font-sans">Días</span>
                  </p>
                  <p className="text-xs font-semibold text-muted-foreground mt-1">
                    Promedio de entrega desde el corte
                  </p>
                </div>
              </CardContent>
            </Card>

          </div>
        </TabsContent>

        {/* 3. COMPONENTE DE CALIDAD */}
        <TabsContent value="calidad" className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <Card className="lg:col-span-1 p-6 space-y-6 shadow-elegant border-none bg-card/60">
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Estado de Garantías</h4>
                <p className="text-3xl font-black text-foreground font-mono">{quejasData?.total ?? 0}</p>
                <p className="text-[10px] text-muted-foreground">Tickets acumulados en sistema</p>
              </div>
              <Separator />
              <div className="space-y-4">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-muted-foreground flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-destructive" /> Abiertas</span>
                  <span>{quejasData?.abiertas ?? 0}</span>
                </div>
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-muted-foreground flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-warning" /> En Revisión</span>
                  <span>{quejasData?.en_revision ?? 0}</span>
                </div>
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-muted-foreground flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-success" /> Resueltas</span>
                  <span>{quejasData?.resueltas ?? 0}</span>
                </div>
              </div>
            </Card>

            <Card className="lg:col-span-3 p-6 shadow-elegant border-none bg-card/40">
              <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-6">Incidencias por Categoría</h4>
              <div className="grid sm:grid-cols-2 gap-6">
                {quejasData?.por_tipo && Object.entries(quejasData.por_tipo).map(([tipo, cant]: [string, any]) => (
                  <div key={tipo} className="p-4 rounded-2xl bg-muted/30 border border-border/40 flex justify-between items-center group hover:border-destructive/30 transition-all">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-foreground">{tipo}</p>
                      <p className="text-[10px] text-muted-foreground">Impacto en satisfacción: {((cant / (quejasData.total || 1)) * 100).toFixed(0)}%</p>
                    </div>
                    <Badge className="bg-destructive/10 text-destructive border-0 font-mono text-sm">{cant}</Badge>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}