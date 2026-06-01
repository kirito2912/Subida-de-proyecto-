import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from "recharts";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button"; 
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sparkles, ArrowUpRight, ShieldCheck, Box, Kanban, TrendingUp, Loader2, Upload, Trash2, FileSpreadsheet, CalendarDays, BarChart3, AlertCircle } from "lucide-react";
import * as XLSX from "xlsx";

import api from "../lib/api";

export const Route = createFileRoute("/prediccion")({
  component: PrediccionPage,
  head: () => ({ meta: [{ title: "Predicción Pedidos" }] }),
});

function PrediccionPage() {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [modelMetrics, setModelMetrics] = useState<any>(null);

  // Queries analíticas de tu backend
  const { data: predicciones, isLoading: loadingPredicciones } = useQuery({
    queryKey: ["prediccion-adelante"],
    queryFn: () => api.prediccion.predecir(6),
  });

  const { data: historico, isLoading: loadingHistorico } = useQuery({
    queryKey: ["prediccion-historico"],
    queryFn: () => api.prediccion.historico(),
  });

  // Procesador inteligente optimizado para el archivo ALREX.csv
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const reader = new FileReader();
      const isCSV = file.name.endsWith(".csv");

      reader.onload = async (e) => {
        try {
          let rowsRaw: any[] = [];

          if (isCSV) {
            const contenidoTexto = e.target?.result as string;
            const lineas = contenidoTexto.split(/\r?\n/);
            if (lineas.length < 2) throw new Error("Archivo vacío");

            const primeraLinea = lineas[0];
            const separador = primeraLinea.includes(";") ? ";" : ",";

            const cabeceras = primeraLinea.split(separador).map(c => 
              c.replace(/^["']|["']$/g, "").trim().toUpperCase()
            );
            
            const idxFecha = cabeceras.findIndex(c => c.includes("FECHA") || c.includes("MES"));
            const idxProduccion = cabeceras.findIndex(c => c.includes("PEODUCCION") || c.includes("PRODUCCION"));

            if (idxFecha === -1 || idxProduccion === -1) {
              alert("Columnas no detectadas. Verifica que existan 'FECHA/MES' y 'PEODUCCION PEDIDO'.");
              setUploading(false);
              return;
            }

            for (let i = 1; i < lineas.length; i++) {
              if (!lineas[i].trim()) continue;
              const columnas = lineas[i].split(separador).map(col => col.replace(/^["']|["']$/g, "").trim());
              rowsRaw.push({ fecha: columnas[idxFecha], cantidad: columnas[idxProduccion] });
            }
          } else {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: "array" });
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

            rowsRaw = jsonData.map((fila) => {
              const keys = Object.keys(fila);
              const keyFecha = keys.find(k => k.toUpperCase().includes("FECHA") || k.toUpperCase().includes("MES"));
              const keyProduccion = keys.find(k => k.toUpperCase().includes("PEODUCCION") || k.toUpperCase().includes("PRODUCCION"));
              return { fecha: keyFecha ? fila[keyFecha] : "", cantidad: keyProduccion ? fila[keyProduccion] : "" };
            });
          }

          const datosLimpios: any[] = [];
          rowsRaw.forEach((row) => {
            if (!row.fecha || !row.cantidad) return;
            let anio = 0, mes = 0;
            const partes = String(row.fecha).trim().split(/[-/]/);

            if (partes.length >= 3) {
              if (partes[0].length === 4) { anio = parseInt(partes[0]); mes = parseInt(partes[1]); }
              else if (partes[2].length === 4) { anio = parseInt(partes[2]); mes = parseInt(partes[1]); }
            } else if (partes.length === 2) {
              if (partes[0].length === 4) { anio = parseInt(partes[0]); mes = parseInt(partes[1]); }
              else if (partes[1].length === 4) { anio = parseInt(partes[1]); mes = parseInt(partes[0]); }
            }

            const total_pedidos = parseInt(row.cantidad) || 0;
            if (anio >= 2000 && mes >= 1 && mes <= 12 && total_pedidos > 0) {
              datosLimpios.push({ anio, mes, total_pedidos });
            }
          });

          const mapaAgrupado: { [key: string]: { anio: number; mes: number; total_pedidos: number } } = {};
          datosLimpios.forEach((item) => {
            const clave = `${item.anio}-${item.mes}`;
            if (!mapaAgrupado[clave]) mapaAgrupado[clave] = { anio: item.anio, mes: item.mes, total_pedidos: 0 };
            mapaAgrupado[clave].total_pedidos += item.total_pedidos;
          });

          const datosFinales = Object.values(mapaAgrupado);
          if (datosFinales.length === 0) {
            alert("No se estructuraron registros. Revisa los campos del archivo.");
            setUploading(false);
            return;
          }

          const nuevoWorkbook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(nuevoWorkbook, XLSX.utils.json_to_sheet(datosFinales), "DataClean");
          const excelBuffer = XLSX.write(nuevoWorkbook, { bookType: "xlsx", type: "array" });
          const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
          
          const formData = new FormData();
          formData.append("file", blob, "dataset_agrupado.xlsx");

          const response = await api.post("/prediccion/upload-excel", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          
          setModelMetrics(response.data);
          queryClient.invalidateQueries({ queryKey: ["prediccion-adelante"] });
          queryClient.invalidateQueries({ queryKey: ["prediccion-historico"] });

        } catch (err) {
          alert("Error interno al procesar el archivo.");
        } finally {
          setUploading(false);
        }
      };

      if (isCSV) reader.readAsText(file, "UTF-8");
      else reader.readAsArrayBuffer(file);
    } catch (error) {
      setUploading(false);
    }
  };

  const handleClearData = async () => {
    if (!confirm("¿Deseas limpiar todos los datos del modelo histórico?")) return;
    try {
      setCleaning(true);
      await api.delete("/prediccion/limpiar");
      setModelMetrics(null);
      // Forzar limpieza inmediata de los datos en caché para que la UI se actualice
      queryClient.setQueryData(["prediccion-adelante"], []);
      queryClient.setQueryData(["prediccion-historico"], []);
      queryClient.invalidateQueries({ queryKey: ["prediccion-adelante"] });
      queryClient.invalidateQueries({ queryKey: ["prediccion-historico"] });
    } catch (error) {
      console.error(error);
    } finally {
      setCleaning(false);
    }
  };

  const chartData = [
    ...(historico?.map((h: any) => ({
      name: h.mes,
      reales: h.ventas,
      proyeccion: h.prediccion,
      margen: [h.prediccion * 0.9, h.prediccion * 1.1]
    })) || []),
    ...(predicciones?.map((p: any) => ({
      name: p.mes.substring(0, 3),
      reales: null,
      proyeccion: p.prediccion,
      margen: [p.limite_inferior, p.limite_superior]
    })) || [])
  ];

  const proximaPrediccion = predicciones?.[0];
  const confianza = predicciones?.[0]?.confianza ? (predicciones[0].confianza * 100).toFixed(1) : "0.0";
  const maxPrediccion = predicciones?.reduce((prev: any, current: any) => (prev.prediccion > current.prediccion) ? prev : current, predicciones[0]);

  return (
    <div className="space-y-8 p-1 animate-in fade-in duration-500">
      {/* Encabezado Principal Rediseñado */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-background via-muted/20 to-transparent p-4 rounded-2xl border border-border/40">
        <PageHeader 
          title="Predicción de Ventas Mensuales" 
          description="Algoritmo cuantitativo de pedidos y capacidad de carga de planta" 
        />
        <Badge variant="secondary" className="font-mono px-3 py-1 bg-accent/10 text-accent border border-accent/20 animate-pulse text-xs">
          Engine V2 Activo
        </Badge>
      </div>

      {/* 1. SECCIÓN DE CONTROL: CARGA ASIMÉTRICA Y SPLIT DATA */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Panel de Carga Rediseñado como Dropzone / Control Integrado */}
        <Card className="xl:col-span-2 overflow-hidden border border-border/60 bg-gradient-to-b from-card/80 to-card/20 backdrop-blur-lg shadow-xl relative">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-emerald-500 via-primary to-transparent" />
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <FileSpreadsheet className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <CardTitle className="text-md font-bold tracking-tight text-foreground">
                  Ingesta Inteligente de Datasets
                </CardTitle>
                <CardDescription className="text-xs">
                  Sube hojas de cálculo consolidadas para reentrenar la matriz lineal del sistema ALREX.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center pt-2">
            <div className="relative group border-2 border-dashed border-border/80 hover:border-emerald-500/50 rounded-xl p-4 transition-all bg-muted/20 hover:bg-muted/40 text-center cursor-pointer">
              <input 
                type="file" 
                accept=".xlsx, .xls, .csv" 
                id="dataset-upload" 
                className="hidden" 
                onChange={handleFileUpload} 
                disabled={uploading}
              />
              <label htmlFor="dataset-upload" className="cursor-pointer flex flex-col items-center gap-2 w-full">
                {uploading ? (
                  <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                ) : (
                  <Upload className="h-8 w-8 text-muted-foreground group-hover:text-emerald-500 transition-colors" />
                )}
                <span className="text-xs font-medium text-foreground">
                  {uploading ? "Analizando y agrupando filas..." : "Arrastra o selecciona tu archivo (.csv / .xlsx)"}
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">Columnas mapeadas: MES, PRODUCCIÓN</span>
              </label>
            </div>

            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted/40 border border-border/40 text-xs text-muted-foreground flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <span>El procesador optimiza automáticamente los delimitadores (<code>;</code> o <code>,</code>) y consolida cantidades duplicadas por mes.</span>
              </div>
              <Button 
                variant="outline" 
                className="w-full gap-2 border-destructive/30 hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-all duration-200" 
                onClick={handleClearData}
                disabled={cleaning}
              >
                {cleaning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Vaciar Base de Datos Histórica
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Estructura del Split Data Rediseñado con Estilo de Tarjeta de Métricas */}
        <Card className="border border-border/60 bg-gradient-to-b from-card/80 to-card/20 backdrop-blur-lg shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-accent via-background to-transparent" />
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-bold tracking-widest uppercase text-muted-foreground">Distribución de Muestras (80/20)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-muted/30 p-3 rounded-xl border border-border/20">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-xs text-muted-foreground">Entrenamiento:</span>
                </div>
                <span className="font-mono font-bold text-sm text-primary">
                  {modelMetrics?.muestras_entrenamiento ?? "—"}
                </span>
              </div>

              <div className="flex justify-between items-center bg-muted/30 p-3 rounded-xl border border-border/20">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-accent" />
                  <span className="text-xs text-muted-foreground">Validación (Test):</span>
                </div>
                <span className="font-mono font-bold text-sm text-accent">
                  {modelMetrics?.muestras_test ?? "—"}
                </span>
              </div>

              <Separator className="bg-border/40" />

              <div>
                <div className="text-[11px] text-muted-foreground mb-1 flex justify-between">
                  <span>Precisión del Modelo (RMSE):</span>
                  {modelMetrics?.metricas_test && <Badge variant="secondary" className="text-[10px] py-0 font-mono">Test OK</Badge>}
                </div>
                <div className="p-3 bg-accent/5 rounded-xl border border-accent/10 flex items-baseline gap-1 justify-center">
                  <span className="text-2xl font-black font-mono tracking-tight text-foreground">
                    {modelMetrics?.metricas_test?.rmse ?? "—"}
                  </span>
                  <span className="text-xs font-medium text-muted-foreground">pedidos de error</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 2. KPIs COMPACTOS E IMPACTANTES */}
      {loadingPredicciones ? (
        <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-accent" /></div>
      ) : !predicciones || predicciones.length === 0 ? (
        <Card className="p-16 text-center border-dashed border-2 border-border/60 text-muted-foreground rounded-2xl bg-muted/10">
          <AlertCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground/60" />
          No se registran datos analíticos en el sistema. Sube un dataset estructurado para inicializar las regresiones automáticas.
        </Card>
      ) : (
        <>
          {/* Fila de Indicadores Clave */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* KPI 1 */}
            <Card className="border border-border/40 shadow-md bg-card/30 relative overflow-hidden group hover:border-primary/30 transition-all duration-300">
              <div className="absolute -right-2 -bottom-2 opacity-5 text-primary group-hover:scale-105 transition-transform duration-500">
                <TrendingUp className="h-24 w-24" />
              </div>
              <CardContent className="p-5 space-y-3">
                <div className="flex justify-between items-center">
                  <Badge className="bg-primary/10 text-primary border-0 text-[10px] font-bold uppercase tracking-wider px-2">Pico de Demanda</Badge>
                  <span className="text-[11px] font-mono text-muted-foreground flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" /> {maxPrediccion?.mes} {maxPrediccion?.anio}
                  </span>
                </div>
                <div>
                  <span className="text-3xl font-black tracking-tight text-foreground font-mono">{maxPrediccion?.prediccion || 0}</span>
                  <span className="text-xs ml-1 text-muted-foreground">pedidos máx.</span>
                </div>
                <div className="text-[11px] text-muted-foreground flex items-center gap-1 border-t border-border/30 pt-2">
                  <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500 shrink-0" /> Capacidad máxima estimada de producción
                </div>
              </CardContent>
            </Card>

            {/* KPI 2 */}
            <Card className="border border-border/40 shadow-md bg-card/30 relative overflow-hidden group hover:border-accent/30 transition-all duration-300">
              <div className="absolute -right-2 -bottom-2 opacity-5 text-accent group-hover:scale-105 transition-transform duration-500">
                <ShieldCheck className="h-24 w-24" />
              </div>
              <CardContent className="p-5 space-y-3">
                <div className="flex justify-between items-center">
                  <Badge className="bg-accent/10 text-accent border-0 text-[10px] font-bold uppercase tracking-wider px-2">Precisión R²</Badge>
                  <span className="text-[11px] font-mono text-muted-foreground">Coef. Determinación</span>
                </div>
                <div>
                  <span className="text-3xl font-black tracking-tight text-foreground font-mono">{confianza}%</span>
                  <span className="text-xs ml-1 text-muted-foreground">confiabilidad</span>
                </div>
                <div className="text-[11px] text-muted-foreground flex items-center gap-1 border-t border-border/30 pt-2">
                  <Sparkles className="h-3.5 w-3.5 text-accent shrink-0" /> Regresión lineal ajustada a estacionalidad real
                </div>
              </CardContent>
            </Card>

            {/* KPI 3 */}
            <Card className="border border-border/40 shadow-md bg-card/30 relative overflow-hidden group hover:border-amber-500/30 transition-all duration-300">
              <div className="absolute -right-2 -bottom-2 opacity-5 text-amber-500 group-hover:scale-105 transition-transform duration-500">
                <Box className="h-24 w-24" />
              </div>
              <CardContent className="p-5 space-y-3">
                <div className="flex justify-between items-center">
                  <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-0 text-[10px] font-bold uppercase tracking-wider px-2">Meta Inmediata</Badge>
                  <span className="text-[11px] font-mono text-muted-foreground">{proximaPrediccion?.mes} {proximaPrediccion?.anio}</span>
                </div>
                <div>
                  <span className="text-3xl font-black tracking-tight text-foreground font-mono">{proximaPrediccion?.prediccion || 0}</span>
                  <span className="text-xs ml-1 text-muted-foreground">unidades</span>
                </div>
                <div className="text-[11px] text-muted-foreground flex items-center gap-1 border-t border-border/30 pt-2 justify-between">
                  <span className="flex items-center gap-1"><Kanban className="h-3.5 w-3.5 text-amber-500 shrink-0" /> Bandas fijadas:</span>
                  <span className="font-mono font-bold text-foreground">{proximaPrediccion?.limite_inferior} - {proximaPrediccion?.limite_superior}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 3. BLOQUE GRÁFICO AVANZADO */}
          <Card className="border border-border/50 bg-card/20 backdrop-blur-md shadow-xl overflow-hidden">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border/30 bg-muted/10">
              <div className="space-y-1">
                <CardTitle className="text-sm font-bold tracking-tight text-foreground flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-accent" /> Comportamiento de Demanda y Proyección Temporal
                </CardTitle>
                <CardDescription className="text-xs">
                  Comparativa de lotes reales históricos frente a intervalos estadísticos de proyección (95% confianza).
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-[11px] font-mono px-2 py-0.5 border-border/80 text-muted-foreground">
                Horizonte: 6 Meses Adelante
              </Badge>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="prediccionColor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="var(--accent)" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="realesColor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
                    <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }} />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: 15, fontSize: 12 }} />
                    {historico?.length && (
                      <ReferenceLine 
                        x={historico[historico.length - 1].mes} 
                        stroke="var(--accent)" 
                        strokeWidth={1.5} 
                        strokeDasharray="4 4" 
                        label={{ value: "FUTURO (INFERENCIA)", position: "insideTopLeft", fill: "var(--accent)", fontSize: 9, fontWeight: "black", letterSpacing: "0.05em" }} 
                      />
                    )}
                    <Area type="monotone" dataKey="margen" stroke="none" fill="var(--accent)" fillOpacity={0.04} name="Banda de Tolerancia" />
                    <Area type="monotone" dataKey="proyeccion" stroke="var(--accent)" strokeWidth={2.5} fill="url(#prediccionColor)" name="Tendencia Estimada" strokeDasharray="4 4" />
                    <Area type="monotone" dataKey="reales" stroke="var(--chart-1)" strokeWidth={3} fill="url(#realesColor)" name="Producción Real" dot={{ r: 4, stroke: "var(--background)", strokeWidth: 2, fill: "var(--chart-1)" }} connectNulls />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* 4. DESGLOSE MENSUAL ASIMÉTRICO */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border/30 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Matriz Desglosada de Inferencia</h3>
              <span className="text-[10px] text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded">6 Registros Próximos</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {predicciones?.map((p: any, idx: number) => (
                <div 
                  key={idx} 
                  className="bg-card/30 border border-border/40 hover:border-border/80 rounded-xl p-4 flex flex-col justify-between space-y-3 hover:shadow-md transition-all duration-300 relative overflow-hidden group"
                >
                  <div className="absolute top-0 left-0 w-[3px] h-full bg-accent opacity-60 group-hover:opacity-100 transition-opacity" / >
                  <div className="space-y-1 pl-1">
                    <p className="font-extrabold text-md text-foreground tracking-tight">{p.mes}</p>
                    <p className="text-[9px] text-muted-foreground font-mono uppercase">Periodo {p.anio}</p>
                  </div>
                  
                  <div className="bg-muted/40 p-2 rounded-lg text-center border border-border/20">
                    <span className="text-xs text-muted-foreground block text-[10px] uppercase tracking-wider font-medium">Predicción</span>
                    <strong className="text-md font-black text-foreground font-mono">{p.prediccion}</strong>
                  </div>

                  <div className="flex justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/20 font-mono pl-1">
                    <span>Min: <strong className="text-foreground">{p.limite_inferior}</strong></span>
                    <span>Max: <strong className="text-foreground">{p.limite_superior}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}