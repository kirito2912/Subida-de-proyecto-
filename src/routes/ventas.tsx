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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Plus, Loader2, Search, Edit2, Trash } from "lucide-react";
import { ventas as ventasApi, clientes as clientesApi } from "@/lib/api";
import { useState } from "react";
import { toast } from "sonner";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import api from "@/lib/api";

export const Route = createFileRoute("/ventas")({
  component: VentasPage,
  head: () => ({ meta: [{ title: "Ventas — CortinaSys" }] }),
});

function estadoColor(s: string) {
  if (s === "Confirmado" || s === "Entregado") return "bg-success/15 text-success border-0";
  if (s === "Pendiente" || s === "En proceso") return "bg-warning/15 text-warning-foreground border-0";
  return "bg-destructive/15 text-destructive border-0";
}

function VentasPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterQuery, setFilterQuery] = useState("");
  const [editingVenta, setEditingVenta] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newVenta, setNewVenta] = useState({
    cliente_id: "",
    tipo_cortina: "Blackout",
    cantidad: 1,
    precio_unitario: 0,
    temporada: "Verano"
  });

  const { data: pedidos = [], isLoading } = useQuery({
    queryKey: ["ventas"],
    queryFn: ventasApi.listar,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/ventas/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ventas"] });
      queryClient.invalidateQueries({ queryKey: ["ventas-resumen"] });
      toast.success("Pedido eliminado correctamente");
    },
    onError: () => toast.error("Error al eliminar el pedido")
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.put(`/ventas/${data.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ventas"] });
      queryClient.invalidateQueries({ queryKey: ["ventas-resumen"] });
      toast.success("Pedido actualizado con éxito");
      setIsEditDialogOpen(false);
    },
    onError: () => toast.error("Error al actualizar el pedido")
  });

  const handleEdit = (pedido: any) => {
    setEditingVenta({ ...pedido });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("¿Estás seguro de que deseas eliminar este pedido?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      ...editingVenta,
      cantidad: parseInt(editingVenta.cantidad.toString()),
      precio_unitario: parseFloat(editingVenta.precio_unitario.toString()),
    });
  };

  // Filtrado en el frontend para respuesta inmediata
  const filteredPedidos = pedidos.filter((p: any) => 
    p.cliente_nombre.toLowerCase().includes(filterQuery.toLowerCase()) ||
    p.tipo_cortina.toLowerCase().includes(filterQuery.toLowerCase()) ||
    p.codigo?.toLowerCase().includes(filterQuery.toLowerCase())
  );

  const handleSearch = () => {
    setFilterQuery(searchTerm);
  };

  const { data: clientes = [] } = useQuery({
    queryKey: ["clientes"],
    queryFn: () => clientesApi.listar(),
  });

  const { data: resumen = [] } = useQuery({
    queryKey: ["ventas-resumen"],
    queryFn: ventasApi.resumenMensual,
  });

  const mutation = useMutation({
    mutationFn: ventasApi.crear,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ventas"] });
      queryClient.invalidateQueries({ queryKey: ["ventas-resumen"] });
      toast.success("Venta registrada con éxito");
      setNewVenta({
        cliente_id: "",
        tipo_cortina: "Blackout",
        cantidad: 1,
        precio_unitario: 0,
        temporada: "Verano"
      });
    },
    onError: () => {
      toast.error("Error al registrar la venta");
    }
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVenta.cliente_id) return toast.error("Seleccione un cliente");
    mutation.mutate({
      ...newVenta,
      cliente_id: parseInt(newVenta.cliente_id),
      cantidad: parseInt(newVenta.cantidad.toString()),
      precio_unitario: parseFloat(newVenta.precio_unitario.toString()),
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
            <Card className="shadow-elegant h-fit">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Plus className="h-5 w-5 text-accent" /> Nuevo pedido</CardTitle>
                <CardDescription>Registra una nueva venta</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreate} className="space-y-3">
                  <div>
                    <Label>Cliente</Label>
                    <select 
                      className="w-full h-10 rounded-md border bg-background px-3 text-sm"
                      value={newVenta.cliente_id}
                      onChange={(e) => setNewVenta({...newVenta, cliente_id: e.target.value})}
                      required
                    >
                      <option value="">Seleccionar cliente...</option>
                      {clientes.map((c: any) => (
                        <option key={c.id} value={c.id}>{c.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Tipo de cortina</Label>
                    <select 
                      className="w-full h-10 rounded-md border bg-background px-3 text-sm"
                      value={newVenta.tipo_cortina}
                      onChange={(e) => setNewVenta({...newVenta, tipo_cortina: e.target.value})}
                    >
                      <option>Blackout</option><option>Roller</option><option>Romana</option><option>Panel</option><option>Veneciana</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label>Cantidad</Label>
                      <Input 
                        type="number" 
                        value={newVenta.cantidad} 
                        onChange={(e) => setNewVenta({...newVenta, cantidad: parseInt(e.target.value)})}
                      />
                    </div>
                    <div>
                      <Label>Precio unit.</Label>
                      <Input 
                        type="number" 
                        placeholder="1200" 
                        value={newVenta.precio_unitario} 
                        onChange={(e) => setNewVenta({...newVenta, precio_unitario: parseFloat(e.target.value)})}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Temporada</Label>
                    <select 
                      className="w-full h-10 rounded-md border bg-background px-3 text-sm"
                      value={newVenta.temporada}
                      onChange={(e) => setNewVenta({...newVenta, temporada: e.target.value})}
                    >
                      <option>Verano</option><option>Otoño</option><option>Invierno</option><option>Primavera</option>
                    </select>
                  </div>
                  <Button type="submit" className="w-full gradient-primary" disabled={mutation.isPending}>
                    {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Registrar pedido
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 shadow-elegant">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Pedidos recientes</CardTitle>
                  <CardDescription>Últimos pedidos registrados en el sistema</CardDescription>
                </div>
                <div className="flex items-center gap-2 bg-muted/30 p-1 rounded-lg border border-border/40">
                  <Input 
                    placeholder="Buscar pedido..." 
                    className="h-8 w-48 bg-transparent border-0 focus-visible:ring-0 text-xs" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleSearch}>
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-accent" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead className="text-right">Cant.</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPedidos.map((p: any) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-mono text-xs">{p.codigo}</TableCell>
                          <TableCell className="font-medium">{p.cliente_nombre}</TableCell>
                          <TableCell>{p.tipo_cortina}</TableCell>
                          <TableCell className="text-right">{p.cantidad}</TableCell>
                          <TableCell className="text-right font-semibold text-accent">Bs. {p.total.toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge className={`${estadoColor(p.estado)} border-0`}>{p.estado}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-accent" onClick={() => handleEdit(p)}>
                                <Edit2 className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(p.id)}>
                                <Trash className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Modal de Edición de Pedido */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
              <DialogTitle>Editar Pedido</DialogTitle>
              <CardDescription>Modifica los detalles del pedido seleccionado.</CardDescription>
            </DialogHeader>
              {editingVenta && (
                <form onSubmit={handleUpdate} className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Tipo de cortina</Label>
                    <select 
                      className="w-full h-10 rounded-md border bg-background px-3 text-sm"
                      value={editingVenta.tipo_cortina}
                      onChange={(e) => setEditingVenta({...editingVenta, tipo_cortina: e.target.value})}
                    >
                      <option>Blackout</option><option>Roller</option><option>Romana</option><option>Panel</option><option>Veneciana</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Cantidad</Label>
                      <Input 
                        type="number" 
                        value={editingVenta.cantidad} 
                        onChange={(e) => setEditingVenta({...editingVenta, cantidad: parseInt(e.target.value)})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Precio unit.</Label>
                      <Input 
                        type="number" 
                        value={editingVenta.precio_unitario} 
                        onChange={(e) => setEditingVenta({...editingVenta, precio_unitario: parseFloat(e.target.value)})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Temporada</Label>
                    <select 
                      className="w-full h-10 rounded-md border bg-background px-3 text-sm"
                      value={editingVenta.temporada}
                      onChange={(e) => setEditingVenta({...editingVenta, temporada: e.target.value})}
                    >
                      <option>Verano</option><option>Otoño</option><option>Invierno</option><option>Primavera</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Estado</Label>
                    <select 
                      className="w-full h-10 rounded-md border bg-background px-3 text-sm"
                      value={editingVenta.estado}
                      onChange={(e) => setEditingVenta({...editingVenta, estado: e.target.value})}
                    >
                      <option>Pendiente</option>
                      <option>En proceso</option>
                      <option>Entregado</option>
                      <option>Cancelado</option>
                    </select>
                  </div>
                  <DialogFooter>
                    <Button type="submit" className="w-full gradient-primary" disabled={updateMutation.isPending}>
                      {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Actualizar Pedido
                    </Button>
                  </DialogFooter>
                </form>
              )}
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="cantidad" className="mt-4">
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle>Ventas mensuales por tipo de cortina</CardTitle>
              <CardDescription>Cantidad de unidades vendidas por categoría</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={resumen}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="mes" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "var(--background)", borderColor: "var(--border)", borderRadius: "8px" }}
                  />
                  <Legend />
                  <Bar dataKey="total_pedidos" name="Total Pedidos" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
