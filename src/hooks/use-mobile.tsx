import * as React from "react";

// Ancho de pantalla máximo en píxeles para considerar que el dispositivo es móvil
const MOBILE_BREAKPOINT = 768;

/**
 * Hook personalizado useIsMobile
 * Monitorea el ancho de la ventana del navegador para determinar si el usuario
 * está visualizando la aplicación desde un dispositivo móvil (pantallas menores a 768px).
 * Registra un listener de eventos resize a través de matchMedia para reaccionar de forma fluida.
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    // Media Query Listener en base al breakpoint configurado
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    
    // Callback para disparar el cambio de estado cuando se altera el tamaño de pantalla
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    
    // Ejecuta la validación inicial
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    
    // Remueve el listener al desmontar el componente para evitar memory leaks
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}

