import { z } from "zod";

// ─── Plan ─────────────────────────────────────────────────────────────────────
export const CreateRazorpayPlanDto = z.object({
  period: z.enum(["daily", "weekly", "monthly", "yearly"]),
  interval: z.number().int().min(1).default(1),
  itemName: z.string().min(1),
  amount: z.number().positive(), // in rupees
  currency: z.string().default("INR"),
  description: z.string().optional(),
});
export type CreateRazorpayPlanInput = z.infer<typeof CreateRazorpayPlanDto>;

// ─── Subscription ─────────────────────────────────────────────────────────────
export const CreateRazorpaySubscriptionDto = z.object({
  customerId: z.string(),
  itemId: z.string(),
  razorpayPlanId: z.string().min(1),
  totalCount: z.number().int().min(1).default(12),
  quantity: z.number().int().min(1).default(1),
  startAt: z.number().optional(),       // Unix timestamp
  addons: z.array(z.object({
    name: z.string(),
    amount: z.number().positive(),
    currency: z.string().default("INR"),
    quantity: z.number().int().default(1),
  })).optional(),
  notes: z.record(z.string()).optional(),
  notifyCustomer: z.boolean().default(true),
});
export type CreateRazorpaySubscriptionInput = z.infer<typeof CreateRazorpaySubscriptionDto>;

// ─── Payment verification ──────────────────────────────────────────────────────
export const VerifyPaymentDto = z.object({
  razorpayPaymentId: z.string(),
  razorpaySubscriptionId: z.string(),
  razorpaySignature: z.string(),
});
export type VerifyPaymentInput = z.infer<typeof VerifyPaymentDto>;

// ─── Webhook ──────────────────────────────────────────────────────────────────
export interface RazorpayWebhookPayload {
  entity: string;
  account_id: string;
  event: string;
  contains: string[];
  payload: {
    subscription?: { entity: RazorpaySubscriptionEntity };
    payment?: { entity: RazorpayPaymentEntity };
  };
  created_at: number;
}

export interface RazorpaySubscriptionEntity {
  id: string;
  plan_id: string;
  status: string;
  current_start?: number;
  current_end?: number;
  paid_count: number;
  remaining_count: string | number;
  charge_at: number;
  notes?: Record<string, string>;
}

export interface RazorpayPaymentEntity {
  id: string;
  amount: number;
  currency: string;
  status: string;
  subscription_id?: string;
  invoice_id?: string;
  description?: string;
  notes?: Record<string, string>;
}
