import { createStart, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";

/**
 * Middleware para la interceptación de errores en el servidor.
 * Atrapa cualquier excepción ocurrida durante la ejecución de las funciones del servidor de TanStack.
 * Si detecta un error con código de estado HTTP (statusCode), lo propaga.
 * Para errores genéricos o crasheos, escribe una bitácora en consola y devuelve una respuesta HTTP 500
 * renderizando una página web amigable.
 */
const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

/**
 * Instancia de inicio de TanStack Start (startInstance).
 * Se encarga de inicializar la configuración del servidor web SSR y registrar middlewares globales
 * como el capturador de errores (errorMiddleware) para todas las peticiones entrantes.
 */
export const startInstance = createStart(() => ({
  requestMiddleware: [errorMiddleware],
}));

