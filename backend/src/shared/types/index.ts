import { Request } from "express";

export interface AuthUser {
  userId: string;
  businessId: string;
  role: "owner" | "staff" | "accountant";
  email: string;
}

export interface AuthRequest extends Request {
  user: AuthUser;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type BillingCycle = "monthly" | "quarterly" | "annual";
export type SubscriptionStatus = "active" | "paused" | "cancelled";
export type InvoiceStatus = "draft" | "pending" | "paid" | "overdue";
export type PaymentMethod = "cash" | "upi" | "card" | "online" | "razorpay";
export type ItemType = "product" | "service" | "membership" | "subscription";
export type UserRole = "owner" | "staff" | "accountant";
export type PlanType = "basic" | "growth" | "pro";

export type RazorpayWebhookEvent =
  | "subscription.activated"
  | "subscription.charged"
  | "subscription.completed"
  | "subscription.updated"
  | "subscription.pending"
  | "subscription.halted"
  | "subscription.cancelled"
  | "subscription.paused"
  | "subscription.resumed"
  | "payment.captured"
  | "payment.failed";
