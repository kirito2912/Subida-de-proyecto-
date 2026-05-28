import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/PageHeader";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Plus, Loader2 } from "lucide-react";
import { useState } from "react";
import api from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/ventas")({
  component: VentasPage,
  head: () => ({ meta: [{ title: "Ventas — CortinaSys" }] }),
});

function estadoColor(s: string) {
  if (s === "Completado" || s === "Entregado") return "bg-success/15 text-success border-0";
  if (s === "Pendiente" || s === "Procesando") return "bg-warning/15 text-warning-foreground border-0";
  return "bg-destructive/15 text-destructive border-0";
}

function VentasPage() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    cliente_id: "",
    tipo_cortina: "Blackout",
    cantidad: 1,
    precio_unitario: 0,
    temporada: "Verano",
    notas: "",
  });

  const { data: pedidos, isLoading: loadingPedidos } = useQuery({
    queryKey: ["pedidos"],
    queryFn: () => api.ventas.listar(),
  });

  const { data: clientes } = useQuery({
    queryKey: ["clientes"],
    queryFn: () => api.clientes.listar(),
  });

  const { data: cantidadData } = useQuery({
    queryKey: ["ventas-tipo-grafico"],
    queryFn: () => api.ventas.resumenMensual(),
  });

  const crearPedidoMutation = useMutation({
    mutationFn: (data: any) => api.ventas.crear(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pedidos"] });
      queryClient.invalidateQueries({ queryKey: ["kpis"] });
      toast.success("Pedido registrado correctamente");
      setFormData({
        cliente_id: "",
        tipo_cortina: "Blackout",
        cantidad: 1,
        precio_unitario: 0,
        temporada: "Verano",
        notas: "",
      });
    },
    onError: (error: Error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.cliente_id) {
      toast.error("Por favor seleccione un cliente");
      return;
    }
    crearPedidoMutation.mutate({
      ...formData,
      cliente_id: parseInt(formData.cliente_id),
      cantidad: parseInt(formData.cantidad.toString()),
      precio_unitario: parseFloat(formData.precio_unitario.toString()),
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Ventas" description="Registro de pedidos y cantidad de ventas" />

      <Tabs defaultValue="registro">
        <TabsList>
          <TabsTrigger value="registro">Registro de pedidos</TabsTrigger>
          <TabsTrigger value="cantidad">Cantidad de ventas</TabsTrigger>
        </TabsList>

        <TabsContent value="registro" className="space-y-4 mt-4">
          <div className="grid lg:grid-cols-3 gap-4">
            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Plus className="h-5 w-5 text-accent" /> Nuevo pedido</CardTitle>
                <CardDescription>Registra una nueva venta</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div>
                    <Label>Cliente</Label>
                    <select 
                      className="w-full h-10 rounded-md border bg-background px-3 text-sm"
                      value={formData.cliente_id}
                      onChange={(e) => setFormData({ ...formData, cliente_id: e.target.value })}
                    >
                      <option value="">Seleccionar cliente...</option>
                      {clientes?.map((c) => (
                        <option key={c.id} value={c.id}>{c.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <div><Label>Tipo de cortina</Label>
                    <select 
                      className="w-full h-10 rounded-md border bg-background px-3 text-sm"
                      value={formData.tipo_cortina}
                      onChange={(e) => setFormData({ ...formData, tipo_cortina: e.target.value })}
                    >
                      <option>Blackout</option><option>Roller</option><option>Romana</option><option>Panel</option><option>Veneciana</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><Label>Cantidad</Label>
                      <Input 
                        type="number" 
                        value={formData.cantidad} 
                        onChange={(e) => setFormData({ ...formData, cantidad: parseInt(e.target.value) })}
                      />
                    </div>
                    <div><Label>Precio unit.</Label>
                      <Input 
                        type="number" 
                        placeholder="1200" 
                        value={formData.precio_unitario}
                        onChange={(e) => setFormData({ ...formData, precio_unitario: parseFloat(e.target.value) })}
                      />
                    </div>
                  </div>
                  <div><Label>Temporada</Label>
                    <select 
                      className="w-full h-10 rounded-md border bg-background px-3 text-sm"
                      value={formData.temporada}
                      onChange={(e) => setFormData({ ...formData, temporada: e.target.value })}
                    >
                      <option>Verano</option><option>Otoño</option><option>Invierno</option><option>Primavera</option>
                    </select>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full gradient-primary" 
                    disabled={crearPedidoMutation.isPending}
                  >
                    {crearPedidoMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Registrar pedido
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 shadow-elegant">
              <CardHeader>
                <CardTitle>Pedidos recientes</CardTitle>
                <CardDescription>Últimos pedidos registrados en el sistema</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingPedidos ? (
                  <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Código</TableHead><TableHead>Cliente</TableHead><TableHead>Tipo</TableHead>
                        <TableHead className="text-right">Cant.</TableHead><TableHead className="text-right">Total</TableHead><TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pedidos?.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-mono text-xs">{p.codigo}</TableCell>
                          <TableCell className="font-medium">{p.cliente_nombre}</TableCell>
                          <TableCell>{p.tipo_cortina}</TableCell>
                          <TableCell className="text-right">{p.cantidad}</TableCell>
                          <TableCell className="text-right font-semibold text-accent">Bs. {p.total.toLocaleString()}</TableCell>
                          <TableCell><Badge className={estadoColor(p.estado)}>{p.estado}</Badge></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="cantidad" className="space-y-4 mt-4">
          <div className="grid lg:grid-cols-2 gap-4">
            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle>Evolución mensual de ventas</CardTitle>
                <CardDescription>Monto total facturado por mes</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={340}>
                  <BarChart data={cantidadData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="mes" stroke="var(--muted-foreground)" />
                    <YAxis stroke="var(--muted-foreground)" />
                    <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }} />
                    <Legend />
                    <Bar dataKey="ventas" name="Cantidad Pedidos" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle>Tendencia de Ingresos</CardTitle>
                <CardDescription>Suma de montos mensuales</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={340}>
                  <LineChart data={cantidadData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="mes" stroke="var(--muted-foreground)" />
                    <YAxis stroke="var(--muted-foreground)" />
                    <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }} />
                    <Line type="monotone" dataKey="monto" name="Monto (Bs.)" stroke="var(--accent)" strokeWidth={3} dot={{ r: 5, fill: "var(--accent)" }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
