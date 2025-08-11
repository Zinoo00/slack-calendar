import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Lighten a hex color by blending it with white.
// `amount` should be between 0 and 1 where 0 returns the original color and 1 returns white.
export function lightenColor(hex: string, amount: number = 0.5): string {
  // Remove leading # if present
  const normalized = hex.replace(/^#/, "");

  // Only handle 6-digit hex codes
  if (normalized.length !== 6) {
    return hex;
  }

  const num = parseInt(normalized, 16);
  let r = (num >> 16) & 0xff;
  let g = (num >> 8) & 0xff;
  let b = num & 0xff;

  r = Math.round(r + (255 - r) * amount);
  g = Math.round(g + (255 - g) * amount);
  b = Math.round(b + (255 - b) * amount);

  const toHex = (n: number) => n.toString(16).padStart(2, "0");

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
