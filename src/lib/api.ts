/**
 * api.ts — Cliente HTTP del frontend para CortinaSys Backend
 *
 * Para desconectar del backend real:
 *   Cambia USE_MOCK a `true` y el front usará datos locales.
 *
 * Para cambiar la URL del backend:
 *   Pon VITE_API_URL=https://tu-backend.onrender.com en el .env del frontend.
 */

const BASE_URL = "/api";
const USE_MOCK = false; // ← ponlo en true para desconectarte del backend

// ─── Utilidad base ─────────────────────────────────────────────────────────────
async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${BASE_URL}${path}`;
  try {
    const res = await fetch(url, {
      headers: { "Content-Type": "application/json", ...options?.headers },
      ...options,
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: res.statusText }));
      console.error(`Error API en ${url}:`, error);
      throw new Error(error.detail ?? `Error ${res.status}: ${res.statusText}`);
    }
    return res.json() as Promise<T>;
  } catch (err) {
    console.error(`Fallo de red/conexión en ${url}:`, err);
    throw err;
  }
}

// ─── Tipos básicos ──────────────────────────────────────────────────────────────
export interface Cliente {
  id: number;
  codigo: string;
  nombre: string;
  tipo: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  created_at: string;
  total_pedidos: number;
  total_monto: number;
}

export interface Pedido {
  id: number;
  codigo: string;
  cliente_id: number;
  cliente_nombre?: string;
  tipo_cortina: string;
  cantidad: number;
  precio_unitario: number;
  total: number;
  temporada: string;
  estado: string;
  fecha_pedido: string;
  fecha_entrega?: string;
  notas?: string;
}

export interface Material {
  id: number;
  nombre: string;
  stock_actual: number;
  stock_minimo: number;
  unidad: string;
  precio_unitario: number;
  proveedor?: string;
  stock_critico: boolean;
}

export interface Produccion {
  id: number;
  pedido_id: number;
  pedido_codigo?: string;
  cliente_nombre?: string;
  tipo_cortina?: string;
  cantidad?: number;
  estado: string;
  fecha_inicio: string;
  fecha_fin?: string;
  operario?: string;
}

export interface Prediccion {
  mes: string;
  mes_numero: number;
  anio: number;
  prediccion: number;
  limite_inferior: number;
  limite_superior: number;
  confianza: number;
}

export interface KPIs {
  ventas_mes: number;
  monto_mes: number;
  en_produccion: number;
  stock_critico: number;
  clientes_activos: number;
  variacion_ventas_pct: number;
}

export interface ReporteVentas {
  periodo: string;
  total_pedidos: number;
  total_monto: number;
  por_tipo: Record<string, number>;
  por_estado: Record<string, number>;
}

export interface ReporteProduccion {
  total_en_proceso: number;
  total_entregados: number;
  tiempo_promedio_dias: number;
}

export interface ReporteQuejas {
  total: number;
  abiertas: number;
  resueltas: number;
  en_revision: number;
  por_tipo: Record<string, number>;
}

export interface TicketQueja {
  id: number;
  cliente_id?: number;
  cliente_nombre?: string;
  descripcion: string;
  tipo: string;
  estado: string;
  resolucion?: string;
  created_at: string;
  updated_at: string;
}

// ─── Dashboard ─────────────────────────────────────────────────────────────────
export const dashboardApi = {
  kpis: () => apiFetch<KPIs>("/dashboard/kpis"),
};

// ─── Clientes ──────────────────────────────────────────────────────────────────
export const clientesApi = {
  listar: (q?: string) => apiFetch<Cliente[]>(`/clientes${q ? `?q=${q}` : ""}`),
  obtener: (id: number) => apiFetch<Cliente>(`/clientes/${id}`),
  crear: (data: Omit<Cliente, "id" | "codigo" | "created_at" | "total_pedidos" | "total_monto">) =>
    apiFetch<Cliente>("/clientes/", { method: "POST", body: JSON.stringify(data) }),
  actualizar: (id: number, data: Partial<Cliente>) =>
    apiFetch<Cliente>(`/clientes/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  eliminar: (id: number) => apiFetch<void>(`/clientes/${id}`, { method: "DELETE" }),
};

// ─── Ventas ────────────────────────────────────────────────────────────────────
export const ventasApi = {
  listar: (params?: { estado?: string; tipo_cortina?: string }) =>
    apiFetch<Pedido[]>(`/ventas${params ? `?${new URLSearchParams(params as Record<string, string>)}` : ""}`),
  obtener: (id: number) => apiFetch<Pedido>(`/ventas/${id}`),
  crear: (data: {
    cliente_id: number;
    tipo_cortina: string;
    cantidad: number;
    precio_unitario: number;
    temporada?: string;
    notas?: string;
  }) => apiFetch<Pedido>("/ventas/", { method: "POST", body: JSON.stringify(data) }),
  actualizar: (id: number, data: Partial<Pedido>) =>
    apiFetch<Pedido>(`/ventas/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  eliminar: (id: number) => apiFetch<void>(`/ventas/${id}`, { method: "DELETE" }),
  resumenMensual: () => apiFetch<{ mes: string; anio: number; ventas: number; monto: number }[]>("/ventas/resumen-mensual"),
  cantidadPorTipo: () => apiFetch<Record<string, number | string>[]>("/ventas/cantidad-por-tipo"),
};

// ─── Inventario ────────────────────────────────────────────────────────────────
export const inventarioApi = {
  listar: (soloCriticos?: boolean) =>
    apiFetch<Material[]>(`/inventario${soloCriticos ? "?solo_criticos=true" : ""}`),
  resumen: () => apiFetch<{ total_materiales: number; stock_critico: number }>("/inventario/resumen"),
  crear: (data: Omit<Material, "id" | "stock_critico">) =>
    apiFetch<Material>("/inventario/", { method: "POST", body: JSON.stringify(data) }),
  actualizar: (id: number, data: Partial<Material>) =>
    apiFetch<Material>(`/inventario/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  ajustarStock: (id: number, cantidad: number) =>
    apiFetch<Material>(`/inventario/${id}/stock?cantidad=${cantidad}`, { method: "PATCH" }),
};

// ─── Producción ────────────────────────────────────────────────────────────────
export const produccionApi = {
  listar: (estado?: string) =>
    apiFetch<Produccion[]>(`/produccion${estado ? `?estado=${estado}` : ""}`),
  resumenSemanal: () =>
    apiFetch<{ semana: string; proceso: number; entregado: number }[]>("/produccion/resumen-semanal"),
  actualizar: (id: number, data: { estado?: string; operario?: string; observaciones?: string }) =>
    apiFetch<Produccion>(`/produccion/${id}`, { method: "PUT", body: JSON.stringify(data) }),
};

// ─── Predicción ────────────────────────────────────────────────────────────────
export const prediccionApi = {
  predecir: (mesesAdelante = 3) =>
    apiFetch<Prediccion[]>(`/prediccion?meses_adelante=${mesesAdelante}`),
  historico: () =>
    apiFetch<{ mes: string; anio: number; ventas: number; prediccion: number }[]>("/prediccion/historico"),
};

// ─── Reportes ──────────────────────────────────────────────────────────────────
export const reportesApi = {
  ventas: (anio?: number, mes?: number) =>
    apiFetch<ReporteVentas>(`/reportes/ventas${anio ? `?anio=${anio}${mes ? `&mes=${mes}` : ""}` : ""}`),
  produccion: (anio?: number, mes?: number) =>
    apiFetch<ReporteProduccion>(`/reportes/produccion${anio ? `?anio=${anio}${mes ? `&mes=${mes}` : ""}` : ""}`),
  quejas: () => apiFetch<ReporteQuejas>("/reportes/quejas"),
};

// ─── Quejas ────────────────────────────────────────────────────────────────────
export const quejasApi = {
  listar: () => apiFetch<TicketQueja[]>("/quejas"),
  crear: (data: { cliente_id?: number; descripcion: string; tipo: string }) =>
    apiFetch("/quejas/", { method: "POST", body: JSON.stringify(data) }),
  actualizar: (id: number, data: { estado?: string; resolucion?: string }) =>
    apiFetch(`/quejas/${id}`, { method: "PUT", body: JSON.stringify(data) }),
};

export default {
  dashboard: dashboardApi,
  clientes: clientesApi,
  ventas: ventasApi,
  inventario: inventarioApi,
  produccion: produccionApi,
  prediccion: prediccionApi,
  reportes: reportesApi,
  quejas: quejasApi,
};
