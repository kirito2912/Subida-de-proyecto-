import axios from "axios";

// Instancia base de Axios apuntando al puerto o dominio de tu backend.
// En desarrollo lee de VITE_API_URL, y en producción utiliza '/api'.
const baseURL = import.meta.env.VITE_API_URL || "/api";

const instance = axios.create({
  baseURL: baseURL,
});

/**
 * Módulo de la API para el Dashboard.
 * Consume indicadores y KPIs generales de la aplicación.
 */
export const dashboard = {
  getKpis: async () => {
    const response = await instance.get("/dashboard/kpis");
    return response.data;
  },
};

/**
 * Módulo de la API para Clientes.
 * Proporciona el CRUD completo de administración de clientes.
 */
export const clientes = {
  // Lista todos los clientes, permitiendo filtrar por término de búsqueda (q)
  listar: async (q?: string) => {
    const response = await instance.get("/clientes/", { params: { q } });
    return response.data;
  },
  // Obtiene un cliente específico por ID
  obtener: async (id: number) => {
    const response = await instance.get(`/clientes/${id}`);
    return response.data;
  },
  // Registra un nuevo cliente
  crear: async (data: any) => {
    const response = await instance.post("/clientes/", data);
    return response.data;
  },
  // Actualiza los datos de un cliente
  actualizar: async (id: number, data: any) => {
    const response = await instance.put(`/clientes/${id}`, data);
    return response.data;
  },
  // Elimina un cliente por su ID
  eliminar: async (id: number) => {
    const response = await instance.delete(`/clientes/${id}`);
    return response.data;
  },
};

/**
 * Módulo de la API para Ventas.
 * Permite registrar pedidos y consumir los históricos resumidos de facturación.
 */
export const ventas = {
  // Recupera todas las órdenes registradas en el sistema
  listar: async () => {
    const response = await instance.get("/ventas/");
    return response.data;
  },
  // Obtiene las sumatorias mensuales agrupadas de ventas
  resumenMensual: async () => {
    const response = await instance.get("/ventas/resumen-mensual");
    return response.data;
  },
  // Registra una nueva compra/orden de cortinas
  crear: async (data: any) => {
    const response = await instance.post("/ventas/", data);
    return response.data;
  },
};

/**
 * Módulo de la API para Inventarios.
 * Permite listar materias primas y ajustar existencias físicas en almacén.
 */
export const inventario = {
  // Lista los materiales e insumos de producción
  listar: async () => {
    const response = await instance.get("/inventario/");
    return response.data;
  },
  // Ajusta la cantidad de stock actual de un material (incremento/reducción)
  actualizarStock: async (id: number, cantidad: number) => {
    const response = await instance.patch(`/inventario/${id}/stock`, { cantidad });
    return response.data;
  },
};

/**
 * Módulo de la API para el Algoritmo Predictivo.
 * Consume proyecciones futuras basadas en regresión lineal y los históricos con tendencia.
 */
export const prediccion = {
  // Solicita la predicción de volumen de pedidos para 'meses' hacia adelante
  predecir: async (meses: number = 6) => {
    const response = await instance.get(`/prediccion/?meses_adelante=${meses}`);
    return response.data;
  },
  // Devuelve los datos de ventas reales fusionados con las estimaciones de tendencia
  historico: async () => {
    const response = await instance.get("/prediccion/historico");
    return response.data;
  }
};

/**
 * Módulo de la API para Quejas y Reclamaciones.
 * Permite radicar, consultar, actualizar el flujo de resolución y eliminar incidencias.
 */
export const quejas = {
  // Lista todas las quejas registradas filtrando opcionalmente por estado y tipo
  listar: async (estado?: string, tipo?: string) => {
    const response = await instance.get("/quejas/", { params: { estado, tipo } });
    return response.data;
  },
  // Obtiene los detalles de una queja por ID
  obtener: async (id: number) => {
    const response = await instance.get(`/quejas/${id}`);
    return response.data;
  },
  // Crea un nuevo reporte de incidencia
  crear: async (data: any) => {
    const response = await instance.post("/quejas/", data);
    return response.data;
  },
  // Actualiza la queja (e.g. agregar resolución técnica o cerrar el ticket)
  actualizar: async (id: number, data: any) => {
    const response = await instance.put(`/quejas/${id}`, data);
    return response.data;
  },
  // Elimina de forma permanente una queja del sistema
  eliminar: async (id: number) => {
    const response = await instance.delete(`/quejas/${id}`);
    return response.data;
  },
};

// Exportación unificada por defecto que agrupa todos los sub-módulos
// e incluye atajos de peticiones genéricas (get, post, put, delete, patch)
export default {
  dashboard,
  clientes,
  ventas,
  inventario,
  prediccion,
  quejas,
  post: (url: string, data?: any, config?: any) => instance.post(url, data, config),
  put: (url: string, data?: any, config?: any) => instance.put(url, data, config),
  delete: (url: string, config?: any) => instance.delete(url, config),
  patch: (url: string, data?: any, config?: any) => instance.patch(url, data, config),
  get: (url: string, config?: any) => instance.get(url, config),
};

