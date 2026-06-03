import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";

/**
 * Componente NotFoundComponent
 * Se renderiza cuando el usuario accede a una ruta inexistente.
 * Muestra un aviso de error 404 amigable en español.
 */
function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Página no encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          La página que buscas no existe o ha sido movida.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Ir al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * Componente ErrorComponent
 * Renderizado de forma aislada en caso de un fallo en tiempo de ejecución (runtime crash)
 * en alguna de las páginas hijas, ofreciendo la opción de reintentar la acción o volver al inicio.
 */
function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Esta página no se cargó
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Algo salió mal por nuestra parte. Puedes intentar recargar la página o volver al inicio.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Intentar de nuevo
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Ir al inicio
          </a>
        </div>
      </div>
    </div>
  );
}

// Configuración global de la ruta raíz (Root Route).
// Asocia metadatos SEO principales, estilos globales y los componentes estructurales (Shell, Component, NotFound, Error).
export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "CortinaSys - Sistema de Ventas y Predicción" },
      { name: "description", content: "Sistema inteligente para la gestión de ventas, producción y predicción de demanda de cortinas." },
      { name: "author", content: "CortinaSys" },
      { property: "og:title", content: "CortinaSys App" },
      { property: "og:description", content: "Gestión y predicción de demanda de cortinas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

/**
 * Componente RootShell
 * Cascarón de HTML inicial renderizado únicamente en el lado del servidor (SSR)
 * para inyectar cabeceras head de TanStack y scripts de hidratación del cliente.
 */
function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

/**
 * Componente RootComponent
 * Renderiza la interfaz principal compartida por la aplicación tras la hidratación en el cliente.
 * Envuelve la aplicación con los proveedores de React Query (estado asíncrono) y Sidebar (menú lateral),
 * estructurando el encabezado adhesivo y el contenedor dinámico para la navegación interna (<Outlet />).
 */
function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AppSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <header className="h-14 flex items-center gap-3 border-b bg-card/80 backdrop-blur-sm px-4 sticky top-0 z-30">
              <SidebarTrigger />
              <div className="h-5 w-px bg-border" />
              <span className="text-sm font-medium text-muted-foreground">
                Sistema de Predicción de Ventas de Cortinas
              </span>
            </header>
            <main className="flex-1 p-6 md:p-8 overflow-x-hidden">
              <Outlet />
            </main>
          </div>
        </div>
      </SidebarProvider>
    </QueryClientProvider>
  );
}

