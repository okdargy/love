import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const USER_AGENT = process.env.WEBSITE_USER_AGENT || "Website/1.0 (https://polytoria.trade; hello@dargy.party)";

export function parseDateInput(value: unknown): Date | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      return null;
    }

    const timestamp = Math.abs(value) < 1e12 ? value * 1000 : value;
    const date = new Date(timestamp);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    if (/^\d+$/.test(trimmed)) {
      const numeric = Number(trimmed);
      if (!Number.isFinite(numeric)) {
        return null;
      }

      const timestamp = Math.abs(numeric) < 1e12 ? numeric * 1000 : numeric;
      const date = new Date(timestamp);
      return Number.isNaN(date.getTime()) ? null : date;
    }

    const date = new Date(trimmed);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  return null;
}

export function formatDateWithFallback(
  value: unknown,
  options?: Intl.DateTimeFormatOptions,
  fallback = "Unknown date",
  locale?: string,
): string {
  const date = parseDateInput(value);
  if (!date) {
    return fallback;
  }

  return date.toLocaleString(locale, options);
}
