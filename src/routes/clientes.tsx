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
import { PageHeader } from "@/components/PageHeader";
import { useState } from "react";
import { clientes as clientesApi, ventas as ventasApi } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/clientes")({
  component: ClientesPage,
  head: () => ({ meta: [{ title: "Clientes — CortinaSys" }] }),
});

function tipoColor(t: string) {
  return t === "Corporativo" ? "bg-chart-1/15 text-chart-1" : t === "Mayorista" ? "bg-chart-2/15 text-chart-2" : "bg-muted text-foreground";
}

function ClientesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterQuery, setFilterQuery] = useState("");
  const [newCliente, setNewCliente] = useState({ nombre: "", telefono: "", email: "", tipo: "Particular" });
  const queryClient = useQueryClient();

  const { data: clientes = [], isLoading } = useQuery({
    queryKey: ["clientes", filterQuery],
    queryFn: () => clientesApi.listar(filterQuery),
  });

  const handleSearch = () => {
    setFilterQuery(searchTerm);
  };

  const { data: historial = [] } = useQuery({
    queryKey: ["ventas"],
    queryFn: ventasApi.listar,
  });

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
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-accent">
                                <Edit2 className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive">
                                <Trash className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {clientes.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
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
