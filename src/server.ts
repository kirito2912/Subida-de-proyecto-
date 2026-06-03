import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

// Tipo para definir la interfaz de entrada del servidor de TanStack Start
type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

/**
 * Carga dinámicamente el punto de entrada de renderizado en servidor de TanStack Start.
 * Utiliza caching en memoria para importar el módulo de servidor únicamente una vez.
 */
async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => ((m as { default?: ServerEntry }).default ?? (m as unknown as ServerEntry)),
    );
  }
  return serverEntryPromise;
}

/**
 * Genera una respuesta HTTP 500 renderizando una página web de error personalizada y amigable,
 * evitando exponer trazas técnicas sensibles al usuario final.
 */
function brandedErrorResponse(): Response {
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

/**
 * Valida si el cuerpo de la respuesta corresponde a un error catastrófico no controlado
 * capturado e interceptado internamente por el motor HTTP subyacente (h3).
 */
function isCatastrophicSsrErrorBody(body: string, responseStatus: number): boolean {
  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return false;
  }

  if (!payload || Array.isArray(payload) || typeof payload !== "object") {
    return false;
  }

  const fields = payload as Record<string, unknown>;
  const expectedKeys = new Set(["message", "status", "unhandled"]);
  if (!Object.keys(fields).every((key) => expectedKeys.has(key))) {
    return false;
  }

  return (
    fields.unhandled === true &&
    fields.message === "HTTPError" &&
    (fields.status === undefined || fields.status === responseStatus)
  );
}

/**
 * Normaliza las respuestas HTTP 500 catastróficas devueltas por TanStack / h3.
 * h3 suele capturar excepciones dentro del ciclo SSR y retornar un JSON plano con un mensaje genérico.
 * Esta función intercepta dicho JSON y lo reemplaza con la página de error visualmente formateada.
 */
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isCatastrophicSsrErrorBody(body, response.status)) {
    return response;
  }

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return brandedErrorResponse();
}

/**
 * Objeto de exportación por defecto compatible con entornos de ejecución modernos.
 * Expone la función principal fetch que delega el manejo de la petición HTTP al motor
 * SSR de TanStack, asegurando capturar fallos catastróficos en el proceso.
 */
export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return brandedErrorResponse();
    }
  },
};

