import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

/**
 * Genera e inicializa una nueva instancia de TanStack Router.
 * Configura el enrutador asociando el árbol de rutas auto-generado (routeTree)
 * y una instancia fresca de QueryClient para el manejo del estado asíncrono,
 * habilitando la restauración del scroll (scrollRestoration) entre transiciones de página.
 */
export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};

