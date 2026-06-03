import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Search, UserPlus, Phone, Mail, Loader2, Edit2, Trash } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { PageHeader } from "@/components/PageHeader";
import { useState } from "react";
import api, { clientes as clientesApi, ventas as ventasApi } from "@/lib/api";
import { toast } from "sonner";

// Definición de la ruta de TanStack Router para /clientes
export const Route = createFileRoute("/clientes")({
  component: ClientesPage,
  head: () => ({ meta: [{ title: "Clientes — CortinaSys" }] }),
});

/**
 * Función utilitaria tipoColor
 * Retorna las clases de Tailwind de badge según la categoría o perfil del cliente.
 */
function tipoColor(t: string) {
  return t === "Corporativo" ? "bg-chart-1/15 text-chart-1" : t === "Mayorista" ? "bg-chart-2/15 text-chart-2" : "bg-muted text-foreground";
}

/**
 * Componente principal ClientesPage
 * Gestiona el listado general de clientes registrados, permite crear registros nuevos
 * a través de un panel lateral de formulario, editarlos en un modal dialog y eliminarlos,
 * además de visualizar el historial de transacciones comerciales asociadas.
 */
function ClientesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterQuery, setFilterQuery] = useState("");
  const [newCliente, setNewCliente] = useState({ nombre: "", telefono: "", email: "", tipo: "Particular" });
  const queryClient = useQueryClient();
  const [editingCliente, setEditingCliente] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Consulta de React Query para obtener de forma asíncrona la lista filtrada de clientes
  const { data: clientes = [], isLoading } = useQuery({
    queryKey: ["clientes", filterQuery],
    queryFn: () => clientesApi.listar(filterQuery),
  });

  // Mutación para borrar permanentemente un cliente en base de datos e invalidar la caché
  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/clientes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      toast.success("Cliente eliminado correctamente");
    },
    onError: () => toast.error("Error al eliminar el cliente")
  });

  // Mutación para guardar las modificaciones aplicadas a un cliente
  const updateMutation = useMutation({
    mutationFn: (data: any) => api.put(`/clientes/${data.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      toast.success("Cliente actualizado con éxito");
      setIsEditDialogOpen(false);
    },
    onError: () => toast.error("Error al actualizar el cliente")
  });

  // Abre el modal Dialog y precarga el cliente para su edición
  const handleEdit = (cliente: any) => {
    setEditingCliente({ ...cliente });
    setIsEditDialogOpen(true);
  };

  // Solicita confirmación y ejecuta la mutación de borrado
  const handleDelete = (id: number) => {
    if (confirm("¿Estás seguro de que deseas eliminar este cliente?")) {
      deleteMutation.mutate(id);
    }
  };

  // Manejador del submit de actualización
  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(editingCliente);
  };

  // Aplica el término de búsqueda al estado filterQuery de react-query
  const handleSearch = () => {
    setFilterQuery(searchTerm);
  };

  // Consulta las órdenes generales de venta para renderizar el historial de transacciones
  const { data: historial = [] } = useQuery({
    queryKey: ["ventas"],
    queryFn: ventasApi.listar,
  });

  // Mutación para la creación física de un nuevo cliente en base de datos
  const mutation = useMutation({
    mutationFn: clientesApi.crear,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      toast.success("Cliente registrado con éxito");
      setNewCliente({ nombre: "", telefono: "", email: "", tipo: "Particular" });
    },
    onError: () => {
      toast.error("Error al registrar el cliente");
    }
  });

  // Manejador del submit de inserción
  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCliente.nombre.trim()) return toast.error("El nombre es obligatorio");
    mutation.mutate(newCliente);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Clientes" description="Gestión de clientes e historial de compras" />

      <Tabs defaultValue="registro">
        <TabsList>
          <TabsTrigger value="registro">Registro de clientes</TabsTrigger>
          <TabsTrigger value="historial">Historial de compras</TabsTrigger>
        </TabsList>

        <TabsContent value="registro" className="space-y-4 mt-4">
          <div className="grid lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-1 shadow-elegant h-fit">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><UserPlus className="h-5 w-5 text-accent" /> Nuevo cliente</CardTitle>
                <CardDescription>Registra un cliente nuevo en el sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreate} className="space-y-3">
                  <div>
                    <Label>Nombre completo</Label>
                    <Input 
                      placeholder="Ej. Juan Pérez" 
                      value={newCliente.nombre} 
                      onChange={(e) => setNewCliente({...newCliente, nombre: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label>Teléfono</Label>
                    <Input 
                      placeholder="+591..." 
                      value={newCliente.telefono} 
                      onChange={(e) => setNewCliente({...newCliente, telefono: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input 
                      type="email" 
                      placeholder="correo@ejemplo.com" 
                      value={newCliente.email} 
                      onChange={(e) => setNewCliente({...newCliente, email: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Tipo de cliente</Label>
                    <select 
                      className="w-full h-10 rounded-md border bg-background px-3 text-sm"
                      value={newCliente.tipo}
                      onChange={(e) => setNewCliente({...newCliente, tipo: e.target.value})}
                    >
                      <option>Particular</option>
                      <option>Mayorista</option>
                      <option>Corporativo</option>
                    </select>
                  </div>
                  <Button type="submit" className="w-full gradient-primary" disabled={mutation.isPending}>
                    {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Registrar cliente
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 shadow-elegant">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Listado de clientes</CardTitle>
                  <CardDescription>{clientes.length} clientes registrados</CardDescription>
                </div>
                <div className="flex items-center gap-2 bg-muted/30 p-1 rounded-lg border border-border/40">
                  <Input 
                    className="h-8 w-48 bg-transparent border-0 focus-visible:ring-0 text-xs" 
                    placeholder="Buscar cliente..." 
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
                        <TableHead>Nombre</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Contacto</TableHead>
                        <TableHead className="text-right">Pedidos</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clientes.map((c: any) => (
                        <TableRow key={c.id}>
                          <TableCell className="font-mono text-xs">{c.codigo}</TableCell>
                          <TableCell className="font-medium">{c.nombre}</TableCell>
                          <TableCell><Badge className={`${tipoColor(c.tipo)} border-0`}>{c.tipo}</Badge></TableCell>
                          <TableCell>
                            <div className="flex flex-col text-xs text-muted-foreground">
                              <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{c.telefono || "N/A"}</span>
                              <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{c.email || "N/A"}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-semibold">{c.total_pedidos}</TableCell>
                          <TableCell className="text-right font-bold text-accent">Bs. {c.total_monto.toLocaleString()}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-accent" onClick={() => handleEdit(c)}>
                                <Edit2 className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(c.id)}>
                                <Trash className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {clientes.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            No se encontraron clientes.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Modal de Edición de Cliente */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Editar Cliente</DialogTitle>
                <CardDescription>Modifica los datos del cliente seleccionado.</CardDescription>
              </DialogHeader>
              {editingCliente && (
                <form onSubmit={handleUpdate} className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Nombre completo</Label>
                    <Input 
                      value={editingCliente.nombre} 
                      onChange={(e) => setEditingCliente({...editingCliente, nombre: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Teléfono</Label>
                    <Input 
                      value={editingCliente.telefono} 
                      onChange={(e) => setEditingCliente({...editingCliente, telefono: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input 
                      type="email"
                      value={editingCliente.email} 
                      onChange={(e) => setEditingCliente({...editingCliente, email: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo de cliente</Label>
                    <select 
                      className="w-full h-10 rounded-md border bg-background px-3 text-sm"
                      value={editingCliente.tipo}
                      onChange={(e) => setEditingCliente({...editingCliente, tipo: e.target.value})}
                    >
                      <option>Particular</option>
                      <option>Mayorista</option>
                      <option>Corporativo</option>
                    </select>
                  </div>
                  <DialogFooter>
                    <Button type="submit" className="w-full gradient-primary" disabled={updateMutation.isPending}>
                      {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Actualizar Cambios
                    </Button>
                  </DialogFooter>
                </form>
              )}
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="historial" className="mt-4">
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle>Historial de ventas</CardTitle>
              <CardDescription>Últimas transacciones realizadas</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historial.map((v: any) => (
                    <TableRow key={v.id}>
                      <TableCell className="text-sm">{new Date(v.fecha_pedido).toLocaleDateString()}</TableCell>
                      <TableCell className="font-medium">{v.cliente_nombre || "Cliente"}</TableCell>
                      <TableCell>{v.tipo_cortina} x {v.cantidad}</TableCell>
                      <TableCell className="text-right font-bold text-accent">Bs. {v.total.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={v.estado === "Entregado" ? "default" : "outline"}>
                          {v.estado}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {historial.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No hay historial de ventas.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
