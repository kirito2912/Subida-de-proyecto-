import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/PageHeader";
import { Separator } from "@/components/ui/separator";
import { Factory, User, Calendar, ClipboardList, CheckCircle2, Flame } from "lucide-react";

export const Route = createFileRoute("/produccion")({
  component: ProduccionPage,
  head: () => ({ meta: [{ title: "Producción — CortinaSys" }] }),
});

const ordenesProduccionData = [
  {
    id: 1,
    pedido_codigo: "OP-201",
    cliente_nombre: "Hotel Andino S.A.",
    tipo_cortina: "Blackout Motorizada",
    cantidad: 12,
    estado: "En proceso",
    fecha_inicio: "2026-05-20",
    operario: "Daniel Ramos",
    observaciones: "Requiere instalación de motores tubulares 220V."
  },
  {
    id: 2,
    pedido_codigo: "OP-202",
    cliente_nombre: "María González",
    tipo_cortina: "Roller Translucida",
    cantidad: 6,
    estado: "Entregado",
    fecha_inicio: "2026-05-22",
    operario: "Diego Flores",
    observaciones: "Entregado a conformidad en empaque reforzado."
  },
  {
    id: 3,
    pedido_codigo: "OP-203",
    cliente_nombre: "Decoraciones Cruz",
    tipo_cortina: "Romana Estampada",
    cantidad: 15,
    estado: "En proceso",
    fecha_inicio: "2026-05-25",
    operario: "Daniel Ramos",
    observaciones: "Corte de tela completado, en fase de costura de varillas."
  },
  {
    id: 4,
    pedido_codigo: "OP-204",
    cliente_nombre: "Constructora Lima",
    tipo_cortina: "Panel Japonés",
    cantidad: 8,
    estado: "En proceso",
    fecha_inicio: "2026-05-26",
    operario: "Diego Flores",
    observaciones: "A la espera de confirmación de guías de aluminio por despacho."
  }
];

function ProduccionPage() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Control de Planta" 
        description="Línea operativa y monitoreo del workflow de confección en tiempo real" 
      />

      {/* Grid de Tarjetas de Producción */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
        {ordenesProduccionData.map((o) => {
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
                  
                  <div className="h-12 w-12 rounded-xl bg-accent/10 flex flex-col items-center justify-center border border-accent/20">
                    <span className="text-xs text-muted-foreground font-medium">Cant.</span>
                    <span className="text-lg font-bold text-accent">{o.cantidad}</span>
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
                      <p className="font-semibold truncate max-w-[140px]">{o.operario}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Iniciado el: <strong className="font-mono">{o.fecha_inicio}</strong></span>
                </div>

                <Separator />

                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                    <ClipboardList className="h-3.5 w-3.5" />
                    <span>Observaciones de Taller</span>
                  </div>
                  <p className="text-xs text-foreground bg-background p-2.5 rounded border border-border italic line-clamp-2">
                    "{o.observaciones}"
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}