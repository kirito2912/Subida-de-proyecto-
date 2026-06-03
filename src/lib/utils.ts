import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Función utilitaria cn (Class Name helper).
 * Combina de forma segura y condicional nombres de clases CSS utilizando clsx
 * y resuelve conflictos de prioridad entre clases de Tailwind CSS usando twMerge.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

