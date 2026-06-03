import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  Sparkles,
  Package,
  Factory,
  TrendingUp,
  FileText,
  Frown
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";

// Lista de opciones del menú de navegación lateral con su respectivo título, ruta y representación icónica (Lucide)
const items = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Clientes", url: "/clientes", icon: Users },
  { title: "Ventas", url: "/ventas", icon: ShoppingCart },
  { title: "Inventario", url: "/inventario", icon: Package },
  { title: "Producción", url: "/produccion", icon: Factory },
  { title: "Predicción Ventas", url: "/prediccion", icon: TrendingUp },
  { title: "Reportes", url: "/reportes", icon: FileText },
  { title: "Quejas y Reclamos", url: "/quejas", icon: Frown },
];

/**
 * Componente AppSidebar
 * Renderiza el panel de navegación lateral colapsable (Sidebar) de la aplicación.
 * Utiliza TanStack Router para realizar un enrutamiento SPA rápido y detectar de forma reactiva
 * la ruta activa con el propósito de aplicar estilos visuales resaltados.
 */
export function AppSidebar() {
  // Obtiene de forma reactiva la ruta/path actual desde el estado del router
  const currentPath = useRouterState({ select: (r) => r.location.pathname });

  // Función utilitaria para evaluar si un botón de menú debe mostrarse en estado activo
  const isActive = (path: string) =>
    path === "/" ? currentPath === "/" : currentPath.startsWith(path);

  return (
    <Sidebar collapsible="icon">
      {/* Cabecera del sidebar: Contiene la marca/logo y nombre de la aplicación */}
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg gradient-accent shadow-glow">
            <Sparkles className="h-5 w-5 text-accent-foreground" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-bold text-sidebar-foreground">CortinaSys</span>
            <span className="text-xs text-sidebar-foreground/60">Gestión Integrada</span>
          </div>
        </div>
      </SidebarHeader>

      {/* Contenido principal del sidebar: Listado iterativo de rutas */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegación</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                    <Link to={item.url} className="flex items-center gap-3">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Pie del sidebar: Muestra el avatar y perfil del usuario autenticado */}
      <SidebarFooter className="border-t border-sidebar-border">
        <div className="flex items-center gap-3 p-2 group-data-[collapsible=icon]:hidden">
          <div className="h-8 w-8 rounded-full bg-sidebar-accent flex items-center justify-center text-xs font-semibold text-sidebar-foreground">
            AD
          </div>
          <div className="flex flex-col text-xs">
            <span className="font-medium text-sidebar-foreground">Admin</span>
            <span className="text-sidebar-foreground/60">admin@cortinas.com</span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}