import { BillingCycle, PlanType } from "../types";

export function generateInvoiceNumber(prefix = "INV"): string {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, "0");
  const random = Math.floor(Math.random() * 90000) + 10000;
  return `${prefix}-${year}${month}-${random}`;
}

export function msUntil(targetDate: Date, offsetDays = 0): number {
  const target = new Date(targetDate);
  target.setDate(target.getDate() + offsetDays);
  return Math.max(target.getTime() - Date.now(), 0);
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function nextBillingDate(from: Date, cycle: BillingCycle): Date {
  const d = new Date(from);
  if (cycle === "monthly") d.setMonth(d.getMonth() + 1);
  else if (cycle === "quarterly") d.setMonth(d.getMonth() + 3);
  else d.setFullYear(d.getFullYear() + 1);
  return d;
}

export function formatCurrency(amount: number | string, currency = "INR"): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(typeof amount === "string" ? parseFloat(amount) : amount);
}

export interface PlanLimits {
  clients: number;
  invoicesPerMonth: number;
  whatsappMsgsPerMonth: number;
  staffUsers: number;
  posMode: boolean;
  autoRenewals: boolean;
  customTemplates: boolean;
  razorpaySubscriptions: boolean;
}

const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  basic: {
    clients: 150,
    invoicesPerMonth: 150,
    whatsappMsgsPerMonth: 500,
    staffUsers: 1,
    posMode: false,
    autoRenewals: false,
    customTemplates: false,
    razorpaySubscriptions: false,
  },
  growth: {
    clients: Infinity,
    invoicesPerMonth: 300,
    whatsappMsgsPerMonth: 1000,
    staffUsers: 1,
    posMode: true,
    autoRenewals: true,
    customTemplates: false,
    razorpaySubscriptions: true,
  },
  pro: {
    clients: Infinity,
    invoicesPerMonth: Infinity,
    whatsappMsgsPerMonth: 2000,
    staffUsers: 3,
    posMode: true,
    autoRenewals: true,
    customTemplates: true,
    razorpaySubscriptions: true,
  },
};

export function getPlanLimits(plan: string): PlanLimits {
  return PLAN_LIMITS[plan as PlanType] ?? PLAN_LIMITS.basic;
}

// Convert paise to rupees
export function paisaToRupees(paise: number): number {
  return paise / 100;
}

// Convert rupees to paise
export function rupeesToPaisa(rupees: number): number {
  return Math.round(rupees * 100);
}
