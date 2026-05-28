import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Filter, Calendar, MessageSquareWarning, ShieldAlert, CheckCircle, Wrench, ArrowRight, Loader2 } from "lucide-react";
import api from "@/lib/api";
import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/quejas")({
  component: QuejasPage,
  head: () => ({ meta: [{ title: "Control de Incidentes — CortinaSys" }] }),
});

function estadoEstilo(estado: string) {
  if (estado === "Abierta") return "bg-destructive/10 text-destructive border-none font-bold";
  if (estado === "En revisión") return "bg-warning/10 text-warning-foreground border-none font-bold";
  return "bg-success/10 text-success border-none font-bold";
}

function QuejasPage() {
  const queryClient = useQueryClient();
  const [filtroEstado, setFiltroEstado] = useState("");
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState({ estado: "", resolucion: "" });

  const { data: tickets, isLoading } = useQuery({
    queryKey: ["quejas", filtroEstado],
    queryFn: () => api.quejas.listar(), // El backend no filtra por estado actualmente en listar_quejas pero lo agregaremos si es necesario
  });

  const selectedTicket = tickets?.find(t => t.id === selectedTicketId) || tickets?.[0];

  const actualizarMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.quejas.actualizar(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quejas"] });
      toast.success("Ticket actualizado");
      setEditingId(null);
    },
    onError: (error: Error) => toast.error(`Error: ${error.message}`),
  });

  const handleEdit = (t: any) => {
    setEditingId(t.id);
    setEditData({
      estado: t.estado,
      resolucion: t.resolucion || "",
    });
  };

  const handleSave = () => {
    if (editingId) {
      actualizarMutation.mutate({ id: editingId, data: editData });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b pb-5 border-border/60">
        <PageHeader 
          title="Atención de Incidencias & Post-Venta" 
          description="Consola operativa para auditoría de garantías, quejas y control de calidad" 
        />
        
        <div className="flex flex-wrap items-center gap-2 bg-muted/60 p-1.5 rounded-xl border text-xs font-semibold h-fit">
          <div className="flex items-center gap-1 text-muted-foreground px-1.5">
            <Filter className="h-3.5 w-3.5 text-accent" />
            <span>Filtros API:</span>
          </div>
          <select 
            className="bg-background rounded-lg border px-2.5 py-1.5 outline-none font-bold text-[11px] cursor-pointer hover:bg-muted transition-colors"
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
          >
            <option value="">Todos los Estados</option>
            <option value="Abierta">Abierta</option>
            <option value="En revisión">En revisión</option>
            <option value="Resuelta">Resuelta</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-12 w-12 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 space-y-4 max-h-[650px] overflow-y-auto pr-2">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-muted-foreground pl-1">
              <span>Buzón Operativo</span>
              <span>{tickets?.length || 0} incidentes</span>
            </div>

            <div className="space-y-3">
              {tickets?.filter(t => !filtroEstado || t.estado === filtroEstado).map((t) => {
                const esAbierto = t.estado === "Abierta";
                return (
                  <Card 
                    key={t.id} 
                    className={`shadow-elegant border border-border/50 hover:border-border transition-all duration-200 bg-gradient-to-b from-background to-muted/10 relative group overflow-hidden cursor-pointer ${selectedTicketId === t.id ? "ring-2 ring-accent" : ""}`}
                    onClick={() => setSelectedTicketId(t.id)}
                  >
                    <div className={`absolute top-0 left-0 w-1 h-full transition-opacity ${esAbierto ? "bg-destructive" : "bg-warning"}`} />
                    
                    <CardContent className="p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-black text-foreground">TICKET-{t.id}</span>
                            <span className="text-[10px] text-muted-foreground font-mono">ID Cliente: {t.cliente_id}</span>
                          </div>
                          <p className="font-bold text-sm text-foreground">{t.cliente_nombre}</p>
                        </div>
                        <Badge className={estadoEstilo(t.estado)}>
                          {t.estado}
                        </Badge>
                      </div>

                      <p className="text-xs text-muted-foreground line-clamp-2 pl-1 bg-background/40 p-2 rounded-lg border border-border/30">
                        {t.descripcion}
                      </p>

                      <div className="flex justify-between items-center text-[10px] text-muted-foreground pt-1">
                        <span className="font-semibold bg-accent/5 text-accent border border-accent/20 px-2 py-0.5 rounded-md">
                          {t.tipo}
                        </span>
                        <span className="flex items-center gap-1 font-mono">
                          <Calendar className="h-3 w-3" /> {new Date(t.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground pl-1">
              <span>Inspección de Solución</span>
            </div>

            {selectedTicket ? (
              <Card className="shadow-elegant border-none bg-card/40 backdrop-blur-md sticky top-6">
                <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
                  <div className="flex justify-between items-center">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-mono font-bold text-accent uppercase">Historial del Ticket-{selectedTicket.id}</span>
                      <CardTitle className="text-base font-black">Monitoreo Detallado</CardTitle>
                    </div>
                    <div className="h-9 w-9 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                      <MessageSquareWarning className="h-5 w-5" />
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="p-6 space-y-5">
                  <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-destructive flex items-center gap-1">
                      <ShieldAlert className="h-3.5 w-3.5" /> Reporte de Falla o Reclamo
                    </span>
                    <p className="text-xs text-foreground bg-background/70 border p-3 rounded-xl leading-relaxed">
                      {selectedTicket.descripcion}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-success flex items-center gap-1">
                      <CheckCircle className="h-3.5 w-3.5" /> Registro de Solución
                    </span>
                    <div className="text-xs text-muted-foreground bg-background/70 border p-3 rounded-xl min-h-[80px] flex flex-col justify-between">
                      <p className="italic leading-relaxed">
                        {selectedTicket.resolucion || "No se ha registrado una respuesta o solución técnica todavía."}
                      </p>
                      <div className="flex justify-end gap-1 text-[9px] font-mono text-muted-foreground/80 mt-2">
                        <span>Actualizado:</span> <span>{new Date(selectedTicket.updated_at).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 gap-3 pt-1">
                    <button 
                      className="flex items-center justify-center gap-1.5 h-9 rounded-xl bg-primary text-primary-foreground font-semibold text-xs transition-transform active:scale-95 hover:bg-primary/90 shadow-sm"
                      onClick={() => handleEdit(selectedTicket)}
                    >
                      <Wrench className="h-3.5 w-3.5" /> Editar Estado <ArrowRight className="h-3.5 w-3.5 ml-0.5" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="flex items-center justify-center h-48 text-muted-foreground text-sm border rounded-xl border-dashed">
                Seleccione un ticket para ver detalles
              </div>
            )}
          </div>
        </div>
      )}

      <Dialog open={editingId !== null} onOpenChange={(open) => !open && setEditingId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Actualizar Ticket</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Estado</Label>
              <select 
                className="w-full h-10 rounded-md border bg-background px-3 text-sm"
                value={editData.estado}
                onChange={(e) => setEditData({ ...editData, estado: e.target.value })}
              >
                <option value="Abierta">Abierta</option>
                <option value="En revisión">En revisión</option>
                <option value="Resuelta">Resuelta</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Resolución Técnica</Label>
              <Input 
                value={editData.resolucion}
                onChange={(e) => setEditData({ ...editData, resolucion: e.target.value })}
                placeholder="Describa la solución aplicada..."
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
