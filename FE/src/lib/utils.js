import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge tailwind classes
 * @param {...string} inputs - Class names
 * @returns {string} Merged class string
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
