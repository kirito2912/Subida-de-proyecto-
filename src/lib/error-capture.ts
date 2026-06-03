// Captura los errores originales de forma externa (fuera de banda) para que server.ts
// pueda recuperar el stack trace/traza original del error cuando el motor h3 ya ha
// capturado e invisibilizado la excepción lanzada transformándola en una respuesta 500 genérica.

// Almacena temporalmente el último error capturado con su marca de tiempo (timestamp)
let lastCapturedError: { error: unknown; at: number } | undefined;
// Tiempo de vida en milisegundos para expirar registros obsoletos de error
const TTL_MS = 5_000;

/**
 * Registra y almacena el error en memoria con la marca de tiempo actual.
 */
function record(error: unknown) {
  lastCapturedError = { error, at: Date.now() };
}

// Suscribe manejadores globales para atrapar excepciones sincrónicas y promesas rechazadas no manejadas.
if (typeof globalThis.addEventListener === "function") {
  globalThis.addEventListener("error", (event) => record((event as ErrorEvent).error ?? event));
  globalThis.addEventListener("unhandledrejection", (event) =>
    record((event as PromiseRejectionEvent).reason),
  );
}

/**
 * Consume y retorna el último error registrado si se encuentra dentro del rango de expiración de 5 segundos.
 * Limpia la variable en memoria tras ser consumido para evitar lecturas duplicadas.
 */
export function consumeLastCapturedError(): unknown {
  if (!lastCapturedError) return undefined;
  if (Date.now() - lastCapturedError.at > TTL_MS) {
    lastCapturedError = undefined;
    return undefined;
  }
  const { error } = lastCapturedError;
  lastCapturedError = undefined;
  return error;
}

