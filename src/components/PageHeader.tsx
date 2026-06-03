import { ReactNode } from "react";

// Interfaz para definir las propiedades requeridas por el componente PageHeader
interface PageHeaderProps {
  // El título principal que describe la sección o pantalla actual
  title: string;
  // Descripción u orientación opcional sobre la funcionalidad de la pantalla
  description?: string;
  // Elementos o botones de acción adicionales que se renderizarán a la derecha (opcional)
  actions?: ReactNode;
}

/**
 * Componente PageHeader
 * Proporciona un encabezado estándar y estructurado para todas las pantallas principales.
 * Renderiza el título, subtítulo explicativo y opcionalmente botones de acción (como formularios de creación).
 */
export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between border-b pb-6 mb-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}

