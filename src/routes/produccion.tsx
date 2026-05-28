import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/PageHeader";
import { Separator } from "@/components/ui/separator";
import { Factory, User, Calendar, ClipboardList, CheckCircle2, Flame, Loader2, Edit2 } from "lucide-react";
import api from "@/lib/api";
import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/produccion")({
  component: ProduccionPage,
  head: () => ({ meta: [{ title: "Producción — CortinaSys" }] }),
});

function ProduccionPage() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState({ estado: "", operario: "", observaciones: "" });

  const { data: ordenes, isLoading } = useQuery({
    queryKey: ["produccion"],
    queryFn: () => api.produccion.listar(),
  });

  const actualizarMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.produccion.actualizar(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["produccion"] });
      queryClient.invalidateQueries({ queryKey: ["kpis"] });
      toast.success("Producción actualizada");
      setEditingId(null);
    },
    onError: (error: Error) => toast.error(`Error: ${error.message}`),
  });

  const handleEdit = (o: any) => {
    setEditingId(o.id);
    setEditData({
      estado: o.estado,
      operario: o.operario || "",
      observaciones: o.observaciones || "",
    });
  };

  const handleSave = () => {
    if (editingId) {
      actualizarMutation.mutate({ id: editingId, data: editData });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Control de Planta" 
        description="Línea operativa y monitoreo del workflow de confección en tiempo real" 
      />

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-12 w-12 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
          {ordenes?.map((o) => {
            const isEntregado = o.estado === "Entregado";
            
            return (
              <Card key={o.id} className="shadow-elegant border-t-4 transition-all hover:shadow-md" style={{ borderTopColor: isEntregado ? "var(--success)" : "var(--warning)" }}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded">
                          {o.pedido_codigo}
                        </span>
                        <Badge className={isEntregado ? "bg-success/15 text-success border-0" : "bg-warning/15 text-warning-foreground border-0"}>
                          <div className="flex items-center gap-1">
                            {isEntregado ? <CheckCircle2 className="h-3 w-3" /> : <Flame className="h-3 w-3 animate-pulse" />}
                            {o.estado}
                          </div>
                        </Badge>
                      </div>
                      <CardTitle className="text-lg font-bold mt-1 text-foreground">{o.cliente_nombre}</CardTitle>
                    </div>
                    
                    <div className="flex gap-2 items-center">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => handleEdit(o)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <div className="h-12 w-12 rounded-xl bg-accent/10 flex flex-col items-center justify-center border border-accent/20">
                        <span className="text-xs text-muted-foreground font-medium">Cant.</span>
                        <span className="text-lg font-bold text-accent">{o.cantidad}</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm bg-muted/30 p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Factory className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground font-medium">Modelo</p>
                        <p className="font-semibold truncate max-w-[140px]">{o.tipo_cortina}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground font-medium">Operario</p>
                        <p className="font-semibold truncate max-w-[140px]">{o.operario || "Sin asignar"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Iniciado el: <strong className="font-mono">{new Date(o.fecha_inicio).toLocaleDateString()}</strong></span>
                  </div>

                  <Separator />

                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                      <ClipboardList className="h-3.5 w-3.5" />
                      <span>Observaciones de Taller</span>
                    </div>
                    <p className="text-xs text-foreground bg-background p-2.5 rounded border border-border italic line-clamp-2">
                      "{o.observaciones || "Sin observaciones adicionales"}"
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={editingId !== null} onOpenChange={(open) => !open && setEditingId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Actualizar Producción</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Estado</Label>
              <select 
                className="w-full h-10 rounded-md border bg-background px-3 text-sm"
                value={editData.estado}
                onChange={(e) => setEditData({ ...editData, estado: e.target.value })}
              >
                <option value="En proceso">En proceso</option>
                <option value="Entregado">Entregado</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Operario</Label>
              <Input 
                value={editData.operario}
                onChange={(e) => setEditData({ ...editData, operario: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Observaciones</Label>
              <Input 
                value={editData.observaciones}
                onChange={(e) => setEditData({ ...editData, observaciones: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingId(null)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={actualizarMutation.isPending}>
              {actualizarMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}