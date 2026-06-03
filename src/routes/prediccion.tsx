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

  // 1. Obtener histórico primero
  const { data: historico, isLoading: loadingHistorico } = useQuery({
    queryKey: ["prediccion-historico"],
    queryFn: () => api.prediccion.historico(),
  });

  // 2. Obtener predicciones solo si hay histórico
  const hasHistorico = !!historico && Array.isArray(historico) && historico.length > 0;
  
  const { data: predicciones, isLoading: loadingPredicciones } = useQuery({
    queryKey: ["prediccion-adelante"],
    queryFn: () => api.prediccion.predecir(6),
    enabled: hasHistorico,
  });

  // Procesador inteligente optimizado para archivos Excel (XLSX/XLS) y CSV
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
            
            const idxFecha = cabeceras.findIndex(c => 
              c.includes("FECHA") || c.includes("MES") || c.includes("DATE") || c.includes("MONTH")
            );
            const idxProduccion = cabeceras.findIndex(c => 
              c.includes("PRODUCCION") || c.includes("PEODUCCION") || c.includes("CANTIDAD") || c.includes("PEDIDOS") || c.includes("TOTAL")
            );

            if (idxFecha === -1 || idxProduccion === -1) {
              alert("Columnas no detectadas. Asegúrate de que el archivo tenga columnas como 'FECHA' y 'PRODUCCION'.");
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
            const workbook = XLSX.read(data, { type: "array", cellDates: true });
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            
            // Leemos como array de arrays para buscar la fila de encabezados dinámicamente
            const matrix: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
            
            let headerRowIndex = -1;
            let colIdxFecha = -1;
            let colIdxProduccion = -1;

            // Escaneamos las primeras 10 filas buscando los encabezados
            for (let i = 0; i < Math.min(matrix.length, 10); i++) {
              const row = matrix[i];
              colIdxFecha = row.findIndex(cell => {
                const s = String(cell).toUpperCase();
                return s.includes("FECHA") || s.includes("MES") || s.includes("DATE") || s.includes("MONTH");
              });
              colIdxProduccion = row.findIndex(cell => {
                const s = String(cell).toUpperCase();
                return s.includes("PRODUCCION") || s.includes("PEODUCCION") || s.includes("CANTIDAD") || s.includes("PEDIDOS") || s.includes("TOTAL");
              });

              if (colIdxFecha !== -1 && colIdxProduccion !== -1) {
                headerRowIndex = i;
                break;
              }
            }

            if (headerRowIndex === -1) {
              alert("No se encontraron los encabezados 'FECHA/MES' y 'PRODUCCION' en las primeras filas del Excel.");
              setUploading(false);
              return;
            }

            // Mapeamos los datos desde la fila siguiente a los encabezados
            for (let i = headerRowIndex + 1; i < matrix.length; i++) {
              const row = matrix[i];
              if (row[colIdxFecha] && row[colIdxProduccion] !== undefined) {
                rowsRaw.push({ 
                  fecha: row[colIdxFecha], 
                  cantidad: row[colIdxProduccion] 
                });
              }
            }
          }

          const datosLimpios: any[] = [];
          rowsRaw.forEach((row) => {
            if (!row.fecha || row.cantidad === undefined || row.cantidad === "") return;
            let anio = 0, mes = 0;

            if (row.fecha instanceof Date) {
              anio = row.fecha.getFullYear();
              mes = row.fecha.getMonth() + 1;
            } else {
              const fechaStr = String(row.fecha).trim();
              const partes = fechaStr.split(/[-/]/);

              if (partes.length >= 3) {
                if (partes[0].length === 4) { anio = parseInt(partes[0]); mes = parseInt(partes[1]); }
                else if (partes[2].length === 4) { anio = parseInt(partes[2]); mes = parseInt(partes[1]); }
                else { anio = parseInt(partes[2]); mes = parseInt(partes[1]); }
              } else if (partes.length === 2) {
                if (partes[0].length === 4) { anio = parseInt(partes[0]); mes = parseInt(partes[1]); }
                else if (partes[1].length === 4) { anio = parseInt(partes[1]); mes = parseInt(partes[0]); }
              } else if (!isNaN(Number(fechaStr)) && Number(fechaStr) > 40000) {
                const date = XLSX.SSF.parse_date_code(Number(fechaStr));
                anio = date.y;
                mes = date.m;
              }
            }

            // Limpieza de cantidad (quitar "unidades", "Bs", etc.)
            const cantidadLimpia = String(row.cantidad).replace(/[^0-9.]/g, "");
            const total_pedidos = parseFloat(cantidadLimpia) || 0;

            if (anio >= 2000 && mes >= 1 && mes <= 12 && total_pedidos > 0) {
              datosLimpios.push({ anio, mes, total_pedidos: Math.round(total_pedidos) });
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
            alert("No se pudieron extraer registros válidos. Verifica que las columnas contengan fechas y cantidades numéricas.");
            setUploading(false);
            return;
          }

          const nuevoWorkbook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(nuevoWorkbook, XLSX.utils.json_to_sheet(datosFinales), "DataClean");
          const excelBuffer = XLSX.write(nuevoWorkbook, { bookType: "xlsx", type: "array" });
          const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
          
          const formData = new FormData();
          formData.append("file", blob, "dataset_agrupado.xlsx");

          const response = await api.post("/prediccion/upload-excel", formData);
          
          setModelMetrics(response.data);
          await queryClient.invalidateQueries({ queryKey: ["prediccion-historico"] });
          await queryClient.invalidateQueries({ queryKey: ["prediccion-adelante"] });

        } catch (err: any) {
          console.error("Error al procesar el archivo:", err);
          alert(`Error al procesar el archivo: ${err.message || "Error desconocido"}`);
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
      queryClient.setQueryData(["prediccion-historico"], []);
      queryClient.setQueryData(["prediccion-adelante"], []);
      await queryClient.invalidateQueries({ queryKey: ["prediccion-historico"] });
      await queryClient.invalidateQueries({ queryKey: ["prediccion-adelante"] });
    } catch (error) {
      console.error(error);
      alert("Error al limpiar los datos.");
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
  const maxPrediccion = predicciones && predicciones.length > 0 
    ? predicciones.reduce((prev: any, current: any) => (prev.prediccion > current.prediccion) ? prev : current, predicciones[0])
    : null;

  return (
    <div className="space-y-8 p-1 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-background via-muted/20 to-transparent p-4 rounded-2xl border border-border/40">
        <PageHeader 
          title="Predicción de Ventas Mensuales" 
          description="Algoritmo cuantitativo de pedidos y capacidad de carga de planta" 
        />
        <Badge variant="secondary" className="font-mono px-3 py-1 bg-accent/10 text-accent border border-accent/20 animate-pulse text-xs">
          Engine V3.1 Activo
        </Badge>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2 overflow-hidden border border-border/60 bg-gradient-to-b from-card/80 to-card/20 backdrop-blur-lg shadow-xl relative">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-emerald-500 via-primary to-transparent" />
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <FileSpreadsheet className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <CardTitle className="text-md font-bold tracking-tight text-foreground">
                  Ingesta de Datasets (CSV / Excel)
                </CardTitle>
                <CardDescription className="text-xs">
                  Sube tus archivos históricos para generar predicciones automáticas.
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
                  {uploading ? "Procesando archivo..." : "Selecciona tu archivo (.xlsx, .xls o .csv)"}
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">Reconocimiento automático de columnas</span>
              </label>
            </div>

            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted/40 border border-border/40 text-xs text-muted-foreground flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <span>No importa si los encabezados están en la fila 1 o 2. El sistema los encontrará.</span>
              </div>
              <Button 
                variant="outline" 
                className="w-full gap-2 border-destructive/30 hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-all duration-200" 
                onClick={handleClearData}
                disabled={cleaning}
              >
                {cleaning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Vaciar Histórico
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/60 bg-gradient-to-b from-card/80 to-card/20 backdrop-blur-lg shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-accent via-background to-transparent" />
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-bold tracking-widest uppercase text-muted-foreground">Métricas del Modelo</CardTitle>
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
                  <span className="text-xs text-muted-foreground">Validación:</span>
                </div>
                <span className="font-mono font-bold text-sm text-accent">
                  {modelMetrics?.muestras_test ?? "—"}
                </span>
              </div>

              <Separator className="bg-border/40" />

              <div>
                <div className="text-[11px] text-muted-foreground mb-1 flex justify-between">
                  <span>Error (RMSE):</span>
                  {modelMetrics?.metricas_test && <Badge variant="secondary" className="text-[10px] py-0 font-mono">OK</Badge>}
                </div>
                <div className="p-3 bg-accent/5 rounded-xl border border-accent/10 flex items-baseline gap-1 justify-center">
                  <span className="text-2xl font-black font-mono tracking-tight text-foreground">
                    {modelMetrics?.metricas_test?.rmse ?? "—"}
                  </span>
                  <span className="text-xs font-medium text-muted-foreground">pedidos</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {loadingHistorico || loadingPredicciones ? (
        <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-accent" /></div>
      ) : !hasHistorico ? (
        <Card className="p-16 text-center border-dashed border-2 border-border/60 text-muted-foreground rounded-2xl bg-muted/10">
          <AlertCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground/60" />
          No hay datos históricos. Sube un archivo Excel o CSV para ver las predicciones.
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
              </CardContent>
            </Card>

            <Card className="border border-border/40 shadow-md bg-card/30 relative overflow-hidden group hover:border-accent/30 transition-all duration-300">
              <div className="absolute -right-2 -bottom-2 opacity-5 text-accent group-hover:scale-105 transition-transform duration-500">
                <ShieldCheck className="h-24 w-24" />
              </div>
              <CardContent className="p-5 space-y-3">
                <div className="flex justify-between items-center">
                  <Badge className="bg-accent/10 text-accent border-0 text-[10px] font-bold uppercase tracking-wider px-2">Confiabilidad</Badge>
                  <span className="text-[11px] font-mono text-muted-foreground">R² Score</span>
                </div>
                <div>
                  <span className="text-3xl font-black tracking-tight text-foreground font-mono">{confianza}%</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border/40 shadow-md bg-card/30 relative overflow-hidden group hover:border-amber-500/30 transition-all duration-300">
              <div className="absolute -right-2 -bottom-2 opacity-5 text-amber-500 group-hover:scale-105 transition-transform duration-500">
                <Box className="h-24 w-24" />
              </div>
              <CardContent className="p-5 space-y-3">
                <div className="flex justify-between items-center">
                  <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-0 text-[10px] font-bold uppercase tracking-wider px-2">Próximo Mes</Badge>
                  <span className="text-[11px] font-mono text-muted-foreground">{proximaPrediccion?.mes} {proximaPrediccion?.anio}</span>
                </div>
                <div>
                  <span className="text-3xl font-black tracking-tight text-foreground font-mono">{proximaPrediccion?.prediccion || 0}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border border-border/50 bg-card/20 backdrop-blur-md shadow-xl overflow-hidden">
            <CardHeader className="bg-muted/10">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-accent" /> Gráfico de Tendencias y Predicción
              </CardTitle>
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
                    <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={11} />
                    <YAxis stroke="var(--muted-foreground)" fontSize={11} />
                    <Tooltip />
                    <Legend />
                    {historico && historico.length > 0 && (
                      <ReferenceLine x={historico[historico.length - 1].mes} stroke="var(--accent)" strokeDasharray="3 3" />
                    )}
                    <Area type="monotone" dataKey="proyeccion" stroke="var(--accent)" strokeWidth={2} fill="url(#prediccionColor)" name="Predicción" />
                    <Area type="monotone" dataKey="reales" stroke="var(--chart-1)" strokeWidth={3} fill="url(#realesColor)" name="Real" dot connectNulls />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
