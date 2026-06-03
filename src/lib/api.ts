import axios from "axios";

// Instancia base de Axios apuntando al puerto de tu backend
const baseURL = import.meta.env.VITE_API_URL || "/api";

const instance = axios.create({
  baseURL: baseURL,
});

// Métodos específicos para el módulo de dashboard
export const dashboard = {
  getKpis: async () => {
    const response = await instance.get("/dashboard/kpis");
    return response.data;
  },
};

// Métodos específicos para el módulo de clientes
export const clientes = {
  listar: async (q?: string) => {
    const response = await instance.get("/clientes/", { params: { q } });
    return response.data;
  },
  obtener: async (id: number) => {
    const response = await instance.get(`/clientes/${id}`);
    return response.data;
  },
  crear: async (data: any) => {
    const response = await instance.post("/clientes/", data);
    return response.data;
  },
  actualizar: async (id: number, data: any) => {
    const response = await instance.put(`/clientes/${id}`, data);
    return response.data;
  },
  eliminar: async (id: number) => {
    const response = await instance.delete(`/clientes/${id}`);
    return response.data;
  },
};

// Métodos específicos para el módulo de ventas
export const ventas = {
  listar: async () => {
    const response = await instance.get("/ventas/");
    return response.data;
  },
  resumenMensual: async () => {
    const response = await instance.get("/ventas/resumen-mensual");
    return response.data;
  },
  crear: async (data: any) => {
    const response = await instance.post("/ventas/", data);
    return response.data;
  },
};

// Métodos específicos para el módulo de inventario
export const inventario = {
  listar: async () => {
    const response = await instance.get("/inventario/");
    return response.data;
  },
  actualizarStock: async (id: number, cantidad: number) => {
    const response = await instance.patch(`/inventario/${id}/stock`, { cantidad });
    return response.data;
  },
};

// Métodos específicos para el módulo de predicción
export const prediccion = {
  predecir: async (meses: number = 6) => {
    const response = await instance.get(`/prediccion/?meses_adelante=${meses}`);
    return response.data;
  },
  historico: async () => {
    const response = await instance.get("/prediccion/historico");
    return response.data;
  }
};

// Métodos específicos para el módulo de quejas
export const quejas = {
  listar: async (estado?: string, tipo?: string) => {
    const response = await instance.get("/quejas/", { params: { estado, tipo } });
    return response.data;
  },
  obtener: async (id: number) => {
    const response = await instance.get(`/quejas/${id}`);
    return response.data;
  },
  crear: async (data: any) => {
    const response = await instance.post("/quejas/", data);
    return response.data;
  },
  actualizar: async (id: number, data: any) => {
    const response = await instance.put(`/quejas/${id}`, data);
    return response.data;
  },
  eliminar: async (id: number) => {
    const response = await instance.delete(`/quejas/${id}`);
    return response.data;
  },
};

// Exportación por defecto
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
