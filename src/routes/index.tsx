import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, ArrowDownRight, ShoppingBag, Factory, Package, Users } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { dashboard, prediccion, inventario } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/")({
  component: Dashboard,
  head: () => ({ meta: [{ title: "Dashboard — CortinaSys" }] }),
});

const tipoCortinaData = [
  { name: "Blackout", value: 35, color: "var(--chart-1)" },
  { name: "Roller", value: 28, color: "var(--chart-2)" },
  { name: "Romana", value: 18, color: "var(--chart-3)" },
  { name: "Panel", value: 12, color: "var(--chart-4)" },
  { name: "Veneciana", value: 7, color: "var(--chart-5)" },
];

const produccionData = [
  { semana: "S1", proceso: 24, entregado: 38 },
  { semana: "S2", proceso: 31, entregado: 42 },
  { semana: "S3", proceso: 28, entregado: 45 },
  { semana: "S4", proceso: 35, entregado: 51 },
];

function Kpi({ icon: Icon, label, value, delta, positive = true, loading = false }: any) {
  return (
    <Card className="shadow-elegant border-l-4" style={{ borderLeftColor: "var(--accent)" }}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground font-medium">{label}</p>
            {loading ? (
              <Skeleton className="h-9 w-20 mt-1" />
            ) : (
              <p className="text-3xl font-bold mt-1 text-foreground">{value}</p>
            )}
            <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${positive ? "text-success" : "text-destructive"}`}>
              {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {delta}
            </div>
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
  const { data: kpis, isLoading: isLoadingKpis } = useQuery({
    queryKey: ["kpis"],
    queryFn: dashboard.getKpis,
  });

  const { data: histData } = useQuery({
    queryKey: ["prediccion-historico"],
    queryFn: prediccion.historico,
  });

  const { data: invData } = useQuery({
    queryKey: ["inventario"],
    queryFn: inventario.listar,
  });

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
          loading={isLoadingKpis}
        />
        <Kpi
          icon={Factory}
          label="En producción"
          value={kpis?.en_produccion ?? "0"}
          delta="+8.1% esta semana"
          loading={isLoadingKpis}
        />
        <Kpi
          icon={Package}
          label="Stock crítico"
          value={kpis?.stock_critico ?? "0"}
          delta={kpis?.stock_critico > 0 ? "Revisar inventario" : "Todo al día"}
          positive={kpis?.stock_critico === 0}
          loading={isLoadingKpis}
        />
        <Kpi
          icon={Users}
          label="Clientes activos"
          value={kpis?.clientes_activos ?? "0"}
          delta="+5.2% mensual"
          loading={isLoadingKpis}
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
                <CardTitle>Evolución de ventas vs predicción</CardTitle>
                <CardDescription>Datos históricos y proyección para los próximos meses</CardDescription>
              </CardHeader>
              <CardContent className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={histData || []}>
                    <defs>
                      <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="mes" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "var(--background)", borderColor: "var(--border)", borderRadius: "8px" }}
                      itemStyle={{ fontSize: "12px" }}
                    />
                    <Area type="monotone" dataKey="ventas" stroke="var(--accent)" fillOpacity={1} fill="url(#colorVentas)" strokeWidth={3} />
                    <Area type="monotone" dataKey="prediccion" stroke="var(--muted-foreground)" strokeDasharray="5 5" fill="transparent" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle>Tipos de Cortinas</CardTitle>
                <CardDescription>Distribución de ventas por categoría</CardDescription>
              </CardHeader>
              <CardContent className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={tipoCortinaData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {tipoCortinaData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="produccion" className="mt-4">
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle>Estado de producción semanal</CardTitle>
              <CardDescription>Pedidos en proceso vs completados</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={produccionData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="semana" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "var(--background)", borderColor: "var(--border)", borderRadius: "8px" }}
                  />
                  <Legend />
                  <Bar dataKey="proceso" name="En Proceso" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="entregado" name="Entregado" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventario" className="mt-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle>Estado de materiales</CardTitle>
                <CardDescription>Niveles de stock vs mínimo requerido</CardDescription>
              </CardHeader>
              <CardContent className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={invData?.map((m: any) => ({ name: m.nombre, stock: m.stock_actual, min: m.stock_minimo })) || []} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                    <XAxis type="number" stroke="var(--muted-foreground)" fontSize={10} />
                    <YAxis dataKey="name" type="category" stroke="var(--muted-foreground)" fontSize={10} width={100} />
                    <Tooltip />
                    <Bar dataKey="stock" name="Stock Actual" fill="var(--accent)" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="min" name="Stock Mínimo" fill="var(--muted)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle>Alertas de Inventario</CardTitle>
                <CardDescription>Materiales que requieren reposición inmediata</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {invData?.filter((m: any) => m.stock_actual <= m.stock_minimo).map((m: any) => (
                    <div key={m.id} className="flex items-center justify-between p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                      <div>
                        <p className="font-medium text-destructive">{m.nombre}</p>
                        <p className="text-xs text-muted-foreground">Stock: {m.stock_actual} {m.unidad} (Mín: {m.stock_minimo})</p>
                      </div>
                      <Badge variant="destructive">Crítico</Badge>
                    </div>
                  ))}
                  {invData?.filter((m: any) => m.stock_actual <= m.stock_minimo).length === 0 && (
                    <div className="text-center py-8 text-muted-foreground italic">
                      No hay alertas de stock en este momento.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
