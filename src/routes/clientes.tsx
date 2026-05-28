import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Search, UserPlus, Phone, Mail, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { useState } from "react";
import api from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/clientes")({
  component: ClientesPage,
  head: () => ({ meta: [{ title: "Clientes — CortinaSys" }] }),
});

function tipoColor(t: string) {
  return t === "Corporativo" ? "bg-chart-1/15 text-chart-1" : t === "Mayorista" ? "bg-chart-2/15 text-chart-2" : "bg-muted text-foreground";
}

function ClientesPage() {
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const [formData, setFormData] = useState({
    nombre: "",
    tipo: "Particular",
    telefono: "",
    email: "",
    direccion: "",
  });

  const { data: clientes, isLoading: loadingClientes } = useQuery({
    queryKey: ["clientes", q],
    queryFn: () => api.clientes.listar(q),
  });

  const { data: pedidos } = useQuery({
    queryKey: ["pedidos-recientes"],
    queryFn: () => api.ventas.listar(),
  });

  const crearClienteMutation = useMutation({
    mutationFn: (data: any) => api.clientes.crear(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      toast.success("Cliente registrado correctamente");
      setFormData({
        nombre: "",
        tipo: "Particular",
        telefono: "",
        email: "",
        direccion: "",
      });
    },
    onError: (error: Error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre) {
      toast.error("El nombre es obligatorio");
      return;
    }
    crearClienteMutation.mutate(formData);
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
            <Card className="lg:col-span-1 shadow-elegant">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><UserPlus className="h-5 w-5 text-accent" /> Nuevo cliente</CardTitle>
                <CardDescription>Registra un cliente nuevo en el sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div><Label>Nombre completo</Label>
                    <Input 
                      placeholder="Ej. Juan Pérez" 
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    />
                  </div>
                  <div><Label>Teléfono</Label>
                    <Input 
                      placeholder="+591..." 
                      value={formData.telefono}
                      onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    />
                  </div>
                  <div><Label>Email</Label>
                    <Input 
                      type="email" 
                      placeholder="correo@ejemplo.com" 
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div><Label>Tipo de cliente</Label>
                    <select 
                      className="w-full h-10 rounded-md border bg-background px-3 text-sm"
                      value={formData.tipo}
                      onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                    >
                      <option>Particular</option><option>Mayorista</option><option>Corporativo</option>
                    </select>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full gradient-primary"
                    disabled={crearClienteMutation.isPending}
                  >
                    {crearClienteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Registrar cliente
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 shadow-elegant">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Listado de clientes</CardTitle>
                  <CardDescription>{clientes?.length ?? 0} clientes registrados</CardDescription>
                </div>
                <div className="relative w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    className="pl-8" 
                    placeholder="Buscar cliente..." 
                    value={q} 
                    onChange={(e) => setQ(e.target.value)} 
                  />
                </div>
              </CardHeader>
              <CardContent>
                {loadingClientes ? (
                  <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Código</TableHead><TableHead>Nombre</TableHead><TableHead>Tipo</TableHead>
                        <TableHead>Contacto</TableHead><TableHead className="text-right">Pedidos</TableHead><TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clientes?.map((c) => (
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
                          <TableCell className="text-right font-semibold text-accent">Bs. {c.total_monto.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
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
              <CardTitle>Historial de compras</CardTitle>
              <CardDescription>Últimas transacciones registradas</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead><TableHead>Cliente</TableHead><TableHead>Producto</TableHead>
                    <TableHead className="text-right">Monto</TableHead><TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pedidos?.slice(0, 10).map((h) => (
                    <TableRow key={h.id}>
                      <TableCell className="font-mono text-xs">{new Date(h.fecha_pedido).toLocaleDateString()}</TableCell>
                      <TableCell className="font-medium">{h.cliente_nombre}</TableCell>
                      <TableCell>Cortina {h.tipo_cortina} x {h.cantidad}</TableCell>
                      <TableCell className="text-right font-semibold">Bs. {h.total.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge className={h.estado === "Entregado" ? "bg-success/15 text-success border-0" : "bg-warning/15 text-warning-foreground border-0"}>
                          {h.estado}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
