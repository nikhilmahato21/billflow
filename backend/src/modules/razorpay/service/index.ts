import crypto from "crypto";
import { getRazorpay } from "./client";
import { razorpayRepository } from "../repository";
import { prisma } from "../../../shared/prisma";
import { invoiceQueue } from "../../../shared/queues";
import { generateInvoiceNumber, rupeesToPaisa, paisaToRupees } from "../../../shared/utils";
import { AppError, NotFoundError } from "../../../shared/errors";
import {
  CreateRazorpayPlanInput,
  CreateRazorpaySubscriptionInput,
  VerifyPaymentInput,
  RazorpayWebhookPayload,
} from "../dto";
import { env } from "../../../shared/config/env";

export const razorpayService = {
  // ─── Plans ──────────────────────────────────────────────────────────────────
  async createPlan(businessId: string, input: CreateRazorpayPlanInput) {
    const rz = getRazorpay();

    // Check if a plan already exists for this item
    const existing = await razorpayRepository.findPlanByItemId(businessId, "custom");
    if (existing) return existing;

    const rzPlan = await rz.plans.create({
      period: input.period,
      interval: input.interval,
      item: {
        name: input.itemName,
        amount: rupeesToPaisa(input.amount),
        currency: input.currency,
        description: input.description,
      },
    });

    return razorpayRepository.createPlanRecord({
      businessId,
      razorpayPlanId: rzPlan.id,
      itemId: "custom",
      period: input.period,
      interval: input.interval,
      amount: input.amount,
      currency: input.currency,
      name: input.itemName,
    });
  },

  async createPlanForItem(businessId: string, itemId: string) {
    const rz = getRazorpay();

    const existing = await razorpayRepository.findPlanByItemId(businessId, itemId);
    if (existing) return existing;

    const item = await prisma.item.findFirst({ where: { id: itemId, businessId } });
    if (!item) throw new NotFoundError("Item");

    const rzPlan = await rz.plans.create({
      period: "monthly",
      interval: 1,
      item: {
        name: item.name,
        amount: rupeesToPaisa(Number(item.price)),
        currency: "INR",
        description: `Subscription: ${item.name}`,
      },
    });

    return razorpayRepository.createPlanRecord({
      businessId,
      razorpayPlanId: rzPlan.id,
      itemId,
      period: "monthly",
      interval: 1,
      amount: Number(item.price),
      currency: "INR",
      name: item.name,
    });
  },

  async listPlans(businessId: string) {
    return razorpayRepository.listPlans(businessId);
  },

  // ─── Subscriptions ───────────────────────────────────────────────────────────
  async createSubscription(businessId: string, input: CreateRazorpaySubscriptionInput) {
    const rz = getRazorpay();

    const customer = await prisma.customer.findFirst({ where: { id: input.customerId, businessId } });
    if (!customer) throw new NotFoundError("Customer");

    const item = await prisma.item.findFirst({ where: { id: input.itemId, businessId } });
    if (!item) throw new NotFoundError("Item");

    // Build addons payload
    const addons = input.addons?.map(a => ({
      item: {
        name: a.name,
        amount: rupeesToPaisa(a.amount),
        currency: a.currency,
        quantity: a.quantity,
      },
    }));

    const rzSub = await rz.subscriptions.create({
      plan_id: input.razorpayPlanId,
      total_count: input.totalCount,
      quantity: input.quantity,
      customer_notify: input.notifyCustomer ? 1 : 0,
      start_at: input.startAt,
      addons,
      notes: {
        business_id: businessId,
        customer_name: customer.name,
        customer_phone: customer.phone ?? "",
        item_name: item.name,
        ...input.notes,
      },
    });

    return razorpayRepository.createSubscription({
      businessId,
      customerId: input.customerId,
      itemId: input.itemId,
      razorpayPlanId: input.razorpayPlanId,
      razorpaySubscriptionId: rzSub.id,
      status: rzSub.status,
      totalCount: input.totalCount,
      shortUrl: rzSub.short_url ?? null,
      chargeAt: rzSub.charge_at ? new Date(rzSub.charge_at * 1000) : null,
      startAt: rzSub.start_at ? new Date(rzSub.start_at * 1000) : null,
      notesJson: JSON.stringify(input.notes ?? {}),
    });
  },

  async getSubscription(id: string, businessId: string) {
    const sub = await razorpayRepository.findById(id, businessId);
    if (!sub) throw new NotFoundError("Subscription");
    return sub;
  },

  async listSubscriptions(businessId: string) {
    return razorpayRepository.listForBusiness(businessId);
  },

  async cancelSubscription(id: string, businessId: string, atCycleEnd = false) {
    const sub = await razorpayRepository.findById(id, businessId);
    if (!sub) throw new NotFoundError("Subscription");

    const rz = getRazorpay();
    await rz.subscriptions.cancel(sub.razorpaySubscriptionId, atCycleEnd ? 1 : 0);

    return razorpayRepository.updateStatus(sub.razorpaySubscriptionId, { status: "cancelled" });
  },

  async pauseSubscription(id: string, businessId: string) {
    const sub = await razorpayRepository.findById(id, businessId);
    if (!sub) throw new NotFoundError("Subscription");

    const rz = getRazorpay();
    await rz.subscriptions.pause(sub.razorpaySubscriptionId, { pause_at: "now" });

    return razorpayRepository.updateStatus(sub.razorpaySubscriptionId, { status: "paused" });
  },

  async resumeSubscription(id: string, businessId: string) {
    const sub = await razorpayRepository.findById(id, businessId);
    if (!sub) throw new NotFoundError("Subscription");

    const rz = getRazorpay();
    await rz.subscriptions.resume(sub.razorpaySubscriptionId, { resume_at: "now" });

    return razorpayRepository.updateStatus(sub.razorpaySubscriptionId, { status: "active" });
  },

  async syncFromRazorpay(id: string, businessId: string) {
    const sub = await razorpayRepository.findById(id, businessId);
    if (!sub) throw new NotFoundError("Subscription");

    const rz = getRazorpay();
    const rzSub = await rz.subscriptions.fetch(sub.razorpaySubscriptionId);

    return razorpayRepository.updateStatus(sub.razorpaySubscriptionId, {
      status: rzSub.status,
      paidCount: rzSub.paid_count,
      currentStart: rzSub.current_start ? new Date(rzSub.current_start * 1000) : null,
      currentEnd: rzSub.current_end ? new Date(rzSub.current_end * 1000) : null,
      chargeAt: rzSub.charge_at ? new Date(rzSub.charge_at * 1000) : null,
    });
  },

  // ─── Payment verification ────────────────────────────────────────────────────
  async verifyPayment(input: VerifyPaymentInput): Promise<boolean> {
    if (!env.RAZORPAY_KEY_SECRET) throw new AppError("Razorpay not configured", 503, "not_configured");

    const body = `${input.razorpayPaymentId}|${input.razorpaySubscriptionId}`;
    const expectedSignature = crypto
      .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    return expectedSignature === input.razorpaySignature;
  },

  // ─── Webhook handler ─────────────────────────────────────────────────────────
  async handleWebhook(payload: RazorpayWebhookPayload, signature: string, rawBody: string): Promise<void> {
    // 1. Verify HMAC signature
    if (env.RAZORPAY_WEBHOOK_SECRET) {
      const expected = crypto
        .createHmac("sha256", env.RAZORPAY_WEBHOOK_SECRET)
        .update(rawBody)
        .digest("hex");
      if (expected !== signature) {
        throw new AppError("Invalid webhook signature", 400, "invalid_signature");
      }
    }

    const event = payload.event as string;
    console.log(`[Razorpay Webhook] ${event}`);

    // 2. Route events
    switch (event) {
      case "subscription.activated":
      case "subscription.resumed":
        await handleSubscriptionActivated(payload);
        break;

      case "subscription.charged":
        await handleSubscriptionCharged(payload);
        break;

      case "subscription.halted":
      case "subscription.pending":
        await handleSubscriptionHalted(payload);
        break;

      case "subscription.cancelled":
      case "subscription.completed":
      case "subscription.expired":
        await handleSubscriptionEnded(payload, event);
        break;

      case "subscription.paused":
        await handleSubscriptionPaused(payload);
        break;

      case "payment.captured":
        await handlePaymentCaptured(payload);
        break;

      case "payment.failed":
        await handlePaymentFailed(payload);
        break;

      default:
        console.log(`[Razorpay Webhook] Unhandled event: ${event}`);
    }
  },
};

// ─── Private webhook event handlers ──────────────────────────────────────────

async function handleSubscriptionActivated(payload: RazorpayWebhookPayload) {
  const entity = payload.payload.subscription?.entity;
  if (!entity) return;

  await razorpayRepository.updateStatus(entity.id, {
    status: "active",
    paidCount: entity.paid_count,
    currentStart: entity.current_start ? new Date(entity.current_start * 1000) : null,
    currentEnd: entity.current_end ? new Date(entity.current_end * 1000) : null,
    chargeAt: entity.charge_at ? new Date(entity.charge_at * 1000) : null,
  });
}

async function handleSubscriptionCharged(payload: RazorpayWebhookPayload) {
  const subEntity = payload.payload.subscription?.entity;
  const payEntity = payload.payload.payment?.entity;
  if (!subEntity || !payEntity) return;

  const sub = await razorpayRepository.findByRazorpayId(subEntity.id);
  if (!sub) return;

  // Idempotency: skip if payment already recorded
  const existing = await razorpayRepository.findPaymentByRazorpayId(payEntity.id);
  if (existing) return;

  // Record the payment in our DB
  await razorpayRepository.recordPayment({
    businessId: sub.businessId,
    razorpaySubscriptionId: subEntity.id,
    razorpayPaymentId: payEntity.id,
    amount: paisaToRupees(payEntity.amount),
    currency: payEntity.currency,
    status: "captured",
    paidAt: new Date(),
  });

  // Create an invoice for this charge
  const invoiceNumber = generateInvoiceNumber("RZP");
  const amount = paisaToRupees(payEntity.amount);

  const invoice = await prisma.invoice.create({
    data: {
      businessId: sub.businessId,
      customerId: sub.customerId,
      invoiceNumber,
      status: "paid",
      subtotal: amount,
      taxAmount: 0,
      totalAmount: amount,
      dueDate: new Date(),
      notes: `Razorpay subscription charge — ${subEntity.id}`,
      invoiceItems: {
        create: [{
          name: sub.item.name,
          quantity: 1,
          price: amount,
          taxRate: 0,
          total: amount,
          itemId: sub.itemId,
        }],
      },
      payments: {
        create: [{
          amount,
          method: "razorpay" as any,
          paidAt: new Date(),
          notes: `Razorpay payment ${payEntity.id}`,
        }],
      },
    },
  });

  // Queue PDF generation
  await invoiceQueue.add(`rzp-pdf-${invoice.id}`, { invoiceId: invoice.id, businessId: sub.businessId });

  // Update subscription state
  await razorpayRepository.updateStatus(subEntity.id, {
    status: "active",
    paidCount: subEntity.paid_count,
    currentStart: subEntity.current_start ? new Date(subEntity.current_start * 1000) : null,
    currentEnd: subEntity.current_end ? new Date(subEntity.current_end * 1000) : null,
    chargeAt: subEntity.charge_at ? new Date(subEntity.charge_at * 1000) : null,
  });

  // Update monthly counter
  await prisma.business.update({
    where: { id: sub.businessId },
    data: { invoicesThisMonth: { increment: 1 } },
  });
}

async function handleSubscriptionHalted(payload: RazorpayWebhookPayload) {
  const entity = payload.payload.subscription?.entity;
  if (!entity) return;
  await razorpayRepository.updateStatus(entity.id, { status: "halted" });
}

async function handleSubscriptionEnded(payload: RazorpayWebhookPayload, event: string) {
  const entity = payload.payload.subscription?.entity;
  if (!entity) return;
  const status = event === "subscription.completed" ? "completed" : "cancelled";
  await razorpayRepository.updateStatus(entity.id, { status });
}

async function handleSubscriptionPaused(payload: RazorpayWebhookPayload) {
  const entity = payload.payload.subscription?.entity;
  if (!entity) return;
  await razorpayRepository.updateStatus(entity.id, { status: "paused" });
}

async function handlePaymentCaptured(payload: RazorpayWebhookPayload) {
  const payEntity = payload.payload.payment?.entity;
  if (!payEntity || !payEntity.subscription_id) return;
  // Handled in subscription.charged; standalone payments are noted but no double-booking
  console.log(`[Razorpay] Payment captured: ${payEntity.id}`);
}

async function handlePaymentFailed(payload: RazorpayWebhookPayload) {
  const payEntity = payload.payload.payment?.entity;
  if (!payEntity) return;
  console.log(`[Razorpay] Payment failed: ${payEntity.id}`);

  if (payEntity.subscription_id) {
    await razorpayRepository.updateStatus(payEntity.subscription_id, { status: "pending" });
  }
}
