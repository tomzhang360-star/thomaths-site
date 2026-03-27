import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function formatDateTime(date: Date | string | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleString("zh-CN");
}

export function formatHours(hours: number | string | null): string {
  if (hours === null || hours === undefined) return "—";
  return `${Number(hours).toFixed(1)}h`;
}

export function formatMoney(amount: number | string | null): string {
  if (amount === null || amount === undefined) return "—";
  return `¥${Number(amount).toLocaleString("zh-CN", { minimumFractionDigits: 2 })}`;
}
