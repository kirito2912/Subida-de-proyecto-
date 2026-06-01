import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Filter, Calendar, MessageSquareWarning, ShieldAlert, CheckCircle, Wrench, Trash2, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/quejas")({
  component: QuejasPage,
  head: () => ({ meta: [{ title: "Control de Incidentes — CortinaSys" }] }),
});

// Estructura de datos estáticos idéntica al esquema QuejaOut de su backend
const ticketsReclamosAPI = [
  { 
    id: 402, 
    cliente_id: 12,
    cliente_nombre: "Carlos Mendoza", 
    descripcion: "Falta cordón de freno en el kit del mecanismo Roller e instrucciones de anclaje lateral.", 
    tipo: "Demora en Entrega", 
    estado: "Abierta", 
    resolucion: null,
    created_at: "2026-05-24",
    updated_at: "2026-05-24"
  },
  { 
    id: 401, 
    cliente_id: 45,
    cliente_nombre: "Constructora Lima", 
    descripcion: "Dimensión desfasada por 2cm en el ancho total de la Blackout Motorizada instalada en sala de juntas.", 
    tipo: "Medida Incorrecta", 
    estado: "En revisión", 
    resolucion: "Se envió al técnico Daniel a verificar medidas en obra el día de ayer.",
    created_at: "2026-05-19",
    updated_at: "2026-05-21"
  },
  { 
    id: 400, 
    cliente_id: 8,
    cliente_nombre: "Ana Rojas", 
    descripcion: "Retraso excesivo en la entrega programada de la cortina Veneciana para el departamento de San Miguel.", 
    tipo: "Demora en Entrega", 
    estado: "Resuelta", 
    resolucion: "Lote entregado mediante courier externo prioritario. Cliente notificó recepción.",
    created_at: "2026-05-14",
    updated_at: "2026-05-16"
  },
];

// Gestión de colores según los estados exactos del backend
function estadoEstilo(estado: string) {
  if (estado === "Abierta") return "bg-destructive/10 text-destructive border-none font-bold";
  if (estado === "En revisión") return "bg-warning/10 text-warning-foreground border-none font-bold";
  return "bg-success/10 text-success border-none font-bold";
}

function QuejasPage() {
  return (
    <div className="space-y-6">
      
      {/* CABECERA CORREGIDA: Limpia, suelta sobre el fondo blanco y con la línea gris como Clientes */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b pb-5 border-border/60">
        <PageHeader 
          title="Atención de Incidencias & Post-Venta" 
          description="Consola operativa para auditoría de garantías, quejas y control de calidad" 
        />
        
        {/* FILTROS QUE CONSUMEN LOS PARÁMETROS DEL BACKEND */}
        <div className="flex flex-wrap items-center gap-2 bg-muted/60 p-1.5 rounded-xl border text-xs font-semibold h-fit">
          <div className="flex items-center gap-1 text-muted-foreground px-1.5">
            <Filter className="h-3.5 w-3.5 text-accent" />
            <span>Filtros API:</span>
          </div>
          <select className="bg-background rounded-lg border px-2.5 py-1.5 outline-none font-bold text-[11px] cursor-pointer hover:bg-muted transition-colors">
            <option value="">Todos los Estados</option>
            <option value="Abierta">Abierta</option>
            <option value="En revisión">En revisión</option>
            <option value="Resuelta">Resuelta</option>
          </select>
          <select className="bg-background rounded-lg border px-2.5 py-1.5 outline-none font-bold text-[11px] cursor-pointer hover:bg-muted transition-colors">
            <option value="">Todas las Categorías</option>
            <option value="Demora en Entrega">Demora en Entrega</option>
            <option value="Falla en Motor">Falla en Motor</option>
            <option value="Medida Incorrecta">Medida Incorrecta</option>
            <option value="Tela Defectuosa">Tela Defectuosa</option>
          </select>
        </div>
      </div>

      {/* REJILLA OPERATIVA ASIMÉTRICA */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* COLUMNA IZQUIERDA (3 Columnas): FEED DE TICKETS INTERACTIVOS */}
        <div className="lg:col-span-3 space-y-4 max-h-[650px] overflow-y-auto pr-2">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-muted-foreground pl-1">
            <span>Buzón Operativo (`listar_quejas`)</span>
            <span>{ticketsReclamosAPI.length} incidentes</span>
          </div>

          <div className="space-y-3">
            {ticketsReclamosAPI.map((t) => {
              const esAbierto = t.estado === "Abierta";
              return (
                <Card key={t.id} className="shadow-elegant border border-border/50 hover:border-border transition-all duration-200 bg-gradient-to-b from-background to-muted/10 relative group overflow-hidden cursor-pointer">
                  {/* Línea de estatus flotante en el borde izquierdo */}
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
                        <Calendar className="h-3 w-3" /> {t.created_at}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* COLUMNA DERECHA (2 Columnas): VISUALIZADOR DE RESOLUCIÓN TÉCNICA */}
        <div className="lg:col-span-2 space-y-4">
          <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground pl-1">
            <span>Inspección de Solución (`obtener_queja`)</span>
          </div>

          <Card className="shadow-elegant border-none bg-card/40 backdrop-blur-md sticky top-6">
            <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
              <div className="flex justify-between items-center">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-mono font-bold text-accent uppercase">Historial del Ticket</span>
                  <CardTitle className="text-base font-black">Monitoreo Detallado</CardTitle>
                </div>
                <div className="h-9 w-9 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                  <MessageSquareWarning className="h-5 w-5" />
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-6 space-y-5">
              {/* Bloque del problema */}
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-destructive flex items-center gap-1">
                  <ShieldAlert className="h-3.5 w-3.5" /> Reporte de Falla o Reclamo
                </span>
                <p className="text-xs text-foreground bg-background/70 border p-3 rounded-xl leading-relaxed">
                  {ticketsReclamosAPI[1].descripcion}
                </p>
              </div>

              {/* Bloque de la resolución técnica */}
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-success flex items-center gap-1">
                  <CheckCircle className="h-3.5 w-3.5" /> Registro de Solución (`resolucion`)
                </span>
                <div className="text-xs text-muted-foreground bg-background/70 border p-3 rounded-xl min-h-[80px] flex flex-col justify-between">
                  <p className="italic leading-relaxed">
                    {ticketsReclamosAPI[1].resolucion || "No se ha registrado una respuesta o solución técnica en el servidor todavía."}
                  </p>
                  <div className="flex justify-end gap-1 text-[9px] font-mono text-muted-foreground/80 mt-2">
                    <span>Actualizado:</span> <span>{ticketsReclamosAPI[1].updated_at}</span>
                  </div>
                </div>
              </div>

              <Separator opacity={0.4} />

              {/* Botonera de acciones CRUD */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button className="flex items-center justify-center gap-1.5 h-9 rounded-xl bg-primary text-primary-foreground font-semibold text-xs transition-transform active:scale-95 hover:bg-primary/90 shadow-sm">
                  <Wrench className="h-3.5 w-3.5" /> Editar Estado <ArrowRight className="h-3.5 w-3.5 ml-0.5" />
                </button>
                <button className="flex items-center justify-center gap-1.5 h-9 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive font-semibold text-xs transition-colors hover:bg-destructive hover:text-white">
                  <Trash2 className="h-3.5 w-3.5" /> Archivar Caso
                </button>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}