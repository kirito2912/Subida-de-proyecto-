import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from "recharts";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sparkles, ArrowUpRight, ShieldCheck, Box, Kanban, TrendingUp, Loader2 } from "lucide-react";
import api from "@/lib/api";

export const Route = createFileRoute("/prediccion")({
  component: PrediccionPage,
  head: () => ({ meta: [{ title: "Predicción Pedidos" }] }),
});

function PrediccionPage() {
  const { data: predicciones, isLoading: loadingPredicciones } = useQuery({
    queryKey: ["prediccion-adelante"],
    queryFn: () => api.prediccion.predecir(6), // Predecir 6 meses
  });

  const { data: historico, isLoading: loadingHistorico } = useQuery({
    queryKey: ["prediccion-historico"],
    queryFn: () => api.prediccion.historico(),
  });

  // Combinar histórico y predicciones para el gráfico
  const chartData = [
    ...(historico?.map(h => ({
      name: h.mes,
      reales: h.ventas,
      proyeccion: h.prediccion,
      margen: [h.prediccion * 0.9, h.prediccion * 1.1]
    })) || []),
    ...(predicciones?.map(p => ({
      name: p.mes.substring(0, 3),
      reales: null,
      proyeccion: p.prediccion,
      margen: [p.limite_inferior, p.limite_superior]
    })) || [])
  ];

  const proximaPrediccion = predicciones?.[0];
  const confianza = predicciones?.[0]?.confianza ? (predicciones[0].confianza * 100).toFixed(1) : "0.0";
  const maxPrediccion = predicciones?.reduce((prev, current) => (prev.prediccion > current.prediccion) ? prev : current, predicciones[0]);

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Predicción de Ventas Mensuales" 
        description="Algoritmo cuantitativo de pedidos y capacidad de carga de planta" 
      />

      {loadingPredicciones ? (
        <div className="flex justify-center py-12"><Loader2 className="h-12 w-12 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="shadow-elegant border-none bg-gradient-to-br from-primary/10 via-background to-muted/50 overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4 opacity-10 text-primary group-hover:scale-110 transition-transform">
              <TrendingUp className="h-24 w-24" />
            </div>
            <CardContent className="p-6 space-y-2">
              <div className="flex items-center gap-2">
                <Badge className="bg-primary/10 text-primary border-0 text-[10px] uppercase font-bold tracking-wider">Demanda Techo</Badge>
                <span className="text-xs text-muted-foreground font-mono">{maxPrediccion?.mes} {maxPrediccion?.anio}</span>
              </div>
              <p className="text-4xl font-black text-foreground tracking-tight">{maxPrediccion?.prediccion || 0} <span className="text-sm font-medium text-muted-foreground font-sans">pedidos</span></p>
              <p className="text-xs text-muted-foreground flex items-center gap-1 pt-2">
                <ArrowUpRight className="h-3.5 w-3.5 text-success" /> Proyección incremental para el pico de temporada
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-elegant border-none bg-gradient-to-br from-accent/10 via-background to-muted/50 overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4 opacity-10 text-accent group-hover:scale-110 transition-transform">
              <ShieldCheck className="h-24 w-24" />
            </div>
            <CardContent className="p-6 space-y-2">
              <div className="flex items-center gap-2">
                <Badge className="bg-accent/10 text-accent border-0 text-[10px] uppercase font-bold tracking-wider">Confianza R²</Badge>
                <span className="text-xs text-muted-foreground font-mono">Coeficiente</span>
              </div>
              <p className="text-4xl font-black text-foreground tracking-tight">{confianza}%</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1 pt-2">
                <Sparkles className="h-3.5 w-3.5 text-accent animate-pulse" /> Modelo de regresión lineal estable
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-elegant border-none bg-gradient-to-br from-warning/10 via-background to-muted/50 overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4 opacity-10 text-warning group-hover:scale-110 transition-transform">
              <Box className="h-24 w-24" />
            </div>
            <CardContent className="p-6 space-y-2">
              <div className="flex items-center gap-2">
                <Badge className="bg-warning/10 text-warning-foreground border-0 text-[10px] uppercase font-bold tracking-wider">Volumen Inmediato</Badge>
                <span className="text-xs text-muted-foreground font-mono">{proximaPrediccion?.mes} {proximaPrediccion?.anio}</span>
              </div>
              <p className="text-4xl font-black text-foreground tracking-tight">{proximaPrediccion?.prediccion || 0} <span className="text-sm font-medium text-warning-foreground font-sans">Meta</span></p>
              <p className="text-xs text-muted-foreground flex items-center gap-1 pt-2">
                <Kanban className="h-3.5 w-3.5 text-warning" /> Margen: {proximaPrediccion?.limite_inferior} - {proximaPrediccion?.limite_superior}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="shadow-elegant border-none bg-card/40 backdrop-blur-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
          <div className="space-y-1">
            <CardTitle className="text-md font-bold tracking-wide uppercase text-muted-foreground">Proyección de Volumen de Pedidos</CardTitle>
            <CardDescription>Histórico vs. bandas de tolerancia a futuro (6 meses)</CardDescription>
          </div>
          <Badge variant="outline" className="text-xs font-mono px-2 py-0.5 border-border/80 text-muted-foreground">
            Intervalo de Confianza 95%
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="h-[380px] w-full">
            {loadingHistorico || loadingPredicciones ? (
              <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 5, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="prediccionColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="var(--accent)" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="realesColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} />
                  <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} />
                  <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12 }} />
                  <Legend />
                  
                  {historico?.length && (
                    <ReferenceLine x={historico[historico.length - 1].mes} stroke="var(--border)" strokeWidth={2} strokeDasharray="3 3" label={{ value: "FUTURO", position: "insideTopLeft", fill: "var(--muted-foreground)", fontSize: 10, fontWeight: "bold" }} />
                  )}
                  
                  <Area type="monotone" dataKey="margen" stroke="none" fill="var(--accent)" fillOpacity={0.05} name="Banda de Tolerancia" />
                  <Area type="monotone" dataKey="proyeccion" stroke="var(--accent)" strokeWidth={2.5} fill="url(#prediccionColor)" name="Tendencia/Proyección" strokeDasharray="4 4" />
                  <Area type="monotone" dataKey="reales" stroke="var(--chart-1)" strokeWidth={3} fill="url(#realesColor)" name="Ventas Reales" dot={{ r: 4, stroke: "var(--background)", strokeWidth: 1.5, fill: "var(--chart-1)" }} connectNulls />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Desglose Mensual de Predicción</h3>
          <Badge variant="outline" className="text-[10px] font-mono border-border/80 text-muted-foreground">Ciclo 6 Meses</Badge>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {predicciones?.map((p, idx) => (
            <div key={idx} className="bg-card/40 border border-border/50 rounded-xl p-4 flex flex-col justify-between space-y-4 hover:border-border transition-all duration-200">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-lg text-foreground">{p.mes}</p>
                  <p className="text-[10px] text-muted-foreground font-mono uppercase">Año {p.anio}</p>
                </div>
                <Badge className="bg-accent/10 text-accent border-0 font-mono text-xs">Cant: {p.prediccion}</Badge>
              </div>
              <Separator />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Mínimo: <strong className="text-foreground font-mono">{p.limite_inferior}</strong></span>
                <span>Máximo: <strong className="text-foreground font-mono">{p.limite_superior}</strong></span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
