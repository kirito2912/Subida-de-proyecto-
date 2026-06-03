import { pathToFileURL } from "url";
import * as path from "path";

// Ruta al archivo del servidor de producción compilado
const serverDistPath = path.resolve(process.cwd(), "dist/server/server.js");
const serverDistUrl = pathToFileURL(serverDistPath).href;

/**
 * Importa dinámicamente el servidor Express/Vite SSR compilado.
 * Esto permite cargar la lógica del backend en un entorno de funciones serverless (como Vercel).
 */
async function getServer() {
  try {
    const imported = await import(serverDistUrl);
    return (imported as { default?: any }).default ?? imported;
  } catch (error) {
    console.error("Failed to import SSR server from:", serverDistPath, error);
    throw error;
  }
}

/**
 * Convierte las cabeceras nativas del formato Node.js al objeto standard Headers de Fetch API.
 * Soporta cabeceras múltiples (arrays de strings) y cabeceras vacías/indefinidas.
 */
function nodeHeadersToFetchHeaders(headers: Record<string, string | string[] | undefined>) {
  const fetchHeaders = new Headers();

  for (const [name, value] of Object.entries(headers)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const item of value) {
        fetchHeaders.append(name, item);
      }
    } else {
      fetchHeaders.append(name, value);
    }
  }

  return fetchHeaders;
}

/**
 * Manejador principal para funciones Serverless (Vercel API route).
 * Traduce la petición HTTP entrante de Node (IncomingMessage) al estándar Request,
 * ejecuta el ruteo interno del servidor Express/Vite SSR y escribe la respuesta
 * de vuelta en el flujo de salida de Node (ServerResponse).
 */
export default async function handler(req: any, res: any) {
  try {
    const server = await getServer();

    // Obtener los datos del host y protocolo para construir una URL absoluta
    const protocol = req.headers["x-forwarded-proto"] || "https";
    const host = req.headers.host || "localhost";
    const url = new URL(req.url, `${protocol}://${host}`);

    // Crear el objeto Request compatible con Fetch API
    const request = new Request(url.toString(), {
      method: req.method,
      headers: nodeHeadersToFetchHeaders(req.headers),
      body: req.method === "GET" || req.method === "HEAD" ? undefined : req,
    });

    // Delegar la ejecución del enrutamiento al servidor
    const response = await server.fetch(request, {}, {});

    // Mapear los datos de respuesta de vuelta al formato HTTP serverless
    res.statusCode = response.status;
    response.headers?.forEach((value: string, name: string) => {
      res.setHeader(name, value);
    });

    const body = await response.arrayBuffer();
    res.end(Buffer.from(body));
  } catch (error) {
    console.error(error);
    res.statusCode = 500;
    res.setHeader("content-type", "text/plain; charset=utf-8");
    res.end("Internal Server Error");
  }
}

