import { Queue } from "bullmq";
import { bullMQConnection } from "../redis";

export const invoiceQueue      = new Queue("invoices",      bullMQConnection);
export const notificationQueue = new Queue("notifications", bullMQConnection);
export const reminderQueue     = new Queue("reminders",     bullMQConnection);
export const billingQueue      = new Queue("billing",       bullMQConnection);

// ─── Job data shapes ──────────────────────────────────────────────────────────

export interface InvoiceJobData {
  invoiceId: string;
  businessId: string;
}

export interface NotificationJobData {
  type: "whatsapp" | "email";
  businessId: string;
  customerId: string;
  invoiceId: string;
  template: string;
  variables: Record<string, string>;
  phone?: string;
  email?: string;
}

export interface ReminderJobData {
  invoiceId: string;
  businessId: string;
  customerId: string;
  reminderType: string;
  offsetDays: number;
}

export interface BillingJobData {
  subscriptionId: string;
  businessId: string;
  action: "renew" | "sync_razorpay";
}
