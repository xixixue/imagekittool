import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind class names with conditional logic and conflict resolution.
 * Used by UI components (shadcn/ui style).
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
