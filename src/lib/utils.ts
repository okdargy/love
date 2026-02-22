import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const USER_AGENT = process.env.WEBSITE_USER_AGENT || "Website/1.0 (https://polytoria.trade; hello@dargy.party)";
