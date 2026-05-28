import { pathToFileURL } from "url";
import * as path from "path";

const serverDistPath = path.resolve(process.cwd(), "dist/server/server.js");
const serverDistUrl = pathToFileURL(serverDistPath).href;

async function getServer() {
  try {
    const imported = await import(serverDistUrl);
    return (imported as { default?: any }).default ?? imported;
  } catch (error) {
    console.error("Failed to import SSR server from:", serverDistPath, error);
    throw error;
  }
}

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

export default async function handler(req: any, res: any) {
  try {
    const server = await getServer();

    const protocol = req.headers["x-forwarded-proto"] || "https";
    const host = req.headers.host || "localhost";
    const url = new URL(req.url, `${protocol}://${host}`);

    const request = new Request(url.toString(), {
      method: req.method,
      headers: nodeHeadersToFetchHeaders(req.headers),
      body: req.method === "GET" || req.method === "HEAD" ? undefined : req,
    });

    const response = await server.fetch(request, {}, {});

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
