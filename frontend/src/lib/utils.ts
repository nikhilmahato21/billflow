import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string, currency = "INR") {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function getStatusColor(status: string) {
  const map: Record<string, string> = {
    paid: "text-emerald-700 bg-emerald-50 border-emerald-200",
    pending: "text-amber-700 bg-amber-50 border-amber-200",
    overdue: "text-rose-700 bg-rose-50 border-rose-200",
    draft: "text-slate-600 bg-slate-100 border-slate-200",
    active: "text-emerald-700 bg-emerald-50 border-emerald-200",
    paused: "text-amber-700 bg-amber-50 border-amber-200",
    cancelled: "text-rose-700 bg-rose-50 border-rose-200",
  };
  return map[status] || "text-slate-600 bg-slate-100 border-slate-200";
}
