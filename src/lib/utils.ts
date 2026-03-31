import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type SafeDateInput = string | number | Date | null | undefined;

export function getSafeDate(value: SafeDateInput): Date | null {
  if (value === null || value === undefined || value === "") return null;

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatSafeDate(
  value: SafeDateInput,
  options: Intl.DateTimeFormatOptions,
  fallback = "—",
) {
  const date = getSafeDate(value);
  if (!date) return fallback;

  return new Intl.DateTimeFormat(undefined, options).format(date);
}

export function formatDate(value: SafeDateInput, fallback = "—") {
  return formatSafeDate(value, { year: "numeric", month: "short", day: "numeric" }, fallback);
}

export function formatDateTime(value: SafeDateInput, fallback = "—") {
  return formatSafeDate(
    value,
    {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    },
    fallback,
  );
}
