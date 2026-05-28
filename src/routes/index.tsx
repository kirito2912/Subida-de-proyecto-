import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, ArrowDownRight, ShoppingBag, Factory, Package, Users, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import api from "@/lib/api";

export const Route = createFileRoute("/")({
  component: Dashboard,
  head: () => ({ meta: [{ title: "Dashboard — CortinaSys" }] }),
});

function Kpi({ icon: Icon, label, value, delta, positive = true, loading }: any) {
  return (
    <Card className="shadow-elegant border-l-4" style={{ borderLeftColor: "var(--accent)" }}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground font-medium">{label}</p>
            {loading ? (
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mt-1" />
            ) : (
              <>
                <p className="text-3xl font-bold mt-1 text-foreground">{value}</p>
                <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${positive ? "text-success" : "text-destructive"}`}>
                  {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {delta}
                </div>
              </>
            )}
          </div>
          <div className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center shadow-elegant">
            <Icon className="h-6 w-6 text-primary-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Dashboard() {
  const { data: kpis, isLoading: loadingKpis } = useQuery({
    queryKey: ["kpis"],
    queryFn: () => api.dashboard.kpis(),
  });

  const { data: ventasResumen, isLoading: loadingVentas } = useQuery({
    queryKey: ["ventas-resumen"],
    queryFn: () => api.ventas.resumenMensual(),
  });

  const { data: produccionResumen, isLoading: loadingProduccion } = useQuery({
    queryKey: ["produccion-resumen"],
    queryFn: () => api.produccion.resumenSemanal(),
  });

  const { data: inventarioResumen, isLoading: loadingInventario } = useQuery({
    queryKey: ["inventario-resumen"],
    queryFn: () => api.inventario.resumen(),
  });

  const { data: inventarioLista } = useQuery({
    queryKey: ["inventario-lista"],
    queryFn: () => api.inventario.listar(),
  });

  const { data: tipoCortinaDataRaw } = useQuery({
    queryKey: ["ventas-tipo"],
    queryFn: () => api.ventas.cantidadPorTipo(),
  });

  const tipoCortinaData = (() => {
    if (!tipoCortinaDataRaw || tipoCortinaDataRaw.length === 0) return [];
    
    const totals: Record<string, number> = {};
    const tipos = ["blackout", "roller", "romana", "panel", "veneciana"];
    
    tipoCortinaDataRaw.forEach((month: any) => {
      tipos.forEach(tipo => {
        totals[tipo] = (totals[tipo] || 0) + (month[tipo] || 0);
      });
    });

    return Object.entries(totals)
      .filter(([_, value]) => value > 0)
      .map(([name, value], index) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
        color: `var(--chart-${(index % 5) + 1})`,
      }));
  })();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Visión general de ventas, producción e inventario en tiempo real"
        actions={<Badge className="gradient-accent text-accent-foreground border-0">En vivo</Badge>}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi 
          icon={ShoppingBag} 
          label="Ventas del mes" 
          value={kpis?.ventas_mes ?? "0"} 
          delta={`${kpis?.variacion_ventas_pct ?? 0}% vs mes anterior`} 
          positive={(kpis?.variacion_ventas_pct ?? 0) >= 0}
          loading={loadingKpis}
        />
        <Kpi 
          icon={Factory} 
          label="En producción" 
          value={kpis?.en_produccion ?? "0"} 
          delta="Activos actualmente" 
          loading={loadingKpis}
        />
        <Kpi 
          icon={Package} 
          label="Stock crítico" 
          value={kpis?.stock_critico ?? "0"} 
          delta="Materiales por agotar" 
          positive={false} 
          loading={loadingKpis}
        />
        <Kpi 
          icon={Users} 
          label="Clientes activos" 
          value={kpis?.clientes_activos ?? "0"} 
          delta="Total registrados" 
          loading={loadingKpis}
        />
      </div>

      <Tabs defaultValue="ventas" className="w-full">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="ventas">Ventas</TabsTrigger>
          <TabsTrigger value="produccion">Producción</TabsTrigger>
          <TabsTrigger value="inventario">Inventario</TabsTrigger>
        </TabsList>

        <TabsContent value="ventas" className="space-y-4 mt-4">
          <div className="grid lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2 shadow-elegant">
              <CardHeader>
                <CardTitle>Evolución de ventas</CardTitle>
                <CardDescription>Pedidos mensuales y montos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[320px] w-full">
                  {loadingVentas ? (
                    <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={ventasResumen}>
                        <defs>
                          <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis dataKey="mes" stroke="var(--muted-foreground)" fontSize={12} />
                        <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                        <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }} />
                        <Legend />
                        <Area type="monotone" dataKey="ventas" stroke="var(--chart-1)" fill="url(#g1)" strokeWidth={2} name="Ventas reales" />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle>Tipo de cortina</CardTitle>
                <CardDescription>Distribución de pedidos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[320px] w-full">
                  {tipoCortinaData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={tipoCortinaData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={3}>
                          {tipoCortinaData.map((e: any, i: number) => <Cell key={i} fill={e.color} />)}
                        </Pie>
                        <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Sin datos de tipos</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="produccion" className="mt-4">
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle>Producción semanal</CardTitle>
              <CardDescription>Pedidos en proceso vs entregados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px] w-full">
                {loadingProduccion ? (
                  <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={produccionResumen}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="semana" stroke="var(--muted-foreground)" />
                      <YAxis stroke="var(--muted-foreground)" />
                      <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }} />
                      <Legend />
                      <Bar dataKey="proceso" fill="var(--chart-2)" name="En proceso" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="entregado" fill="var(--chart-1)" name="Entregados" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventario" className="mt-4">
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle>Stock de materiales</CardTitle>
              <CardDescription>Disponibilidad vs nivel mínimo</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px] w-full">
                {loadingInventario ? (
                  <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={inventarioLista?.slice(0, 10)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis type="number" stroke="var(--muted-foreground)" />
                      <YAxis dataKey="nombre" type="category" stroke="var(--muted-foreground)" width={120} />
                      <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }} />
                      <Legend />
                      <Bar dataKey="stock_actual" fill="var(--chart-1)" name="Stock actual" radius={[0, 8, 8, 0]} />
                      <Bar dataKey="stock_minimo" fill="var(--chart-4)" name="Mínimo" radius={[0, 8, 8, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
