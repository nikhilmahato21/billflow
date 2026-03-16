import { prisma } from "../../../shared/prisma";

export interface RazorpaySubscriptionRecord {
  id: string;
  businessId: string;
  customerId: string;
  itemId: string;
  razorpaySubscriptionId: string;
  razorpayPlanId: string;
  status: string;
  currentStart: Date | null;
  currentEnd: Date | null;
  paidCount: number;
  totalCount: number;
  shortUrl: string | null;
  chargeAt: Date | null;
  createdAt: Date;
}

// We store Razorpay subscription data inside the existing subscriptions table
// using the settingsOverride json pattern — extend via a separate table in the schema
// For now we store razorpay data in a JSON column on the subscription row

export const razorpayRepository = {
  // ── Razorpay Plans ────────────────────────────────────────────────────────
  async createPlanRecord(data: {
    businessId: string;
    razorpayPlanId: string;
    itemId: string;
    period: string;
    interval: number;
    amount: number;
    currency: string;
    name: string;
  }) {
    return prisma.razorpayPlan.create({ data });
  },

  async findPlanByItemId(businessId: string, itemId: string) {
    return prisma.razorpayPlan.findFirst({ where: { businessId, itemId } });
  },

  async findPlanByRazorpayId(razorpayPlanId: string) {
    return prisma.razorpayPlan.findUnique({ where: { razorpayPlanId } });
  },

  async listPlans(businessId: string) {
    return prisma.razorpayPlan.findMany({ where: { businessId }, include: { item: true } });
  },

  // ── Razorpay Subscriptions ────────────────────────────────────────────────
  async createSubscription(data: {
    businessId: string;
    customerId: string;
    itemId: string;
    razorpayPlanId: string;
    razorpaySubscriptionId: string;
    status: string;
    totalCount: number;
    shortUrl: string | null;
    chargeAt: Date | null;
    startAt: Date | null;
    notesJson: string;
  }) {
    return prisma.razorpaySubscription.create({
      data: {
        businessId:              data.businessId,
        customerId:              data.customerId,
        itemId:                  data.itemId,
        razorpayPlanId:          data.razorpayPlanId,
        razorpaySubscriptionId:  data.razorpaySubscriptionId,
        status:                  data.status,
        totalCount:              data.totalCount,
        paidCount:               0,
        shortUrl:                data.shortUrl,
        chargeAt:                data.chargeAt,
        startAt:                 data.startAt,
        notesJson:               data.notesJson,
      },
      include: { customer: true, item: true },
    });
  },

  async findById(id: string, businessId: string) {
    return prisma.razorpaySubscription.findFirst({
      where: { id, businessId },
      include: { customer: true, item: true, payments: true },
    });
  },

  async findByRazorpayId(razorpaySubscriptionId: string) {
    return prisma.razorpaySubscription.findUnique({
      where: { razorpaySubscriptionId },
      include: { customer: true, item: true, business: true },
    });
  },

  async listForBusiness(businessId: string) {
    return prisma.razorpaySubscription.findMany({
      where: { businessId },
      include: {
        customer: { select: { id: true, name: true, phone: true, email: true } },
        item:     { select: { id: true, name: true, price: true } },
        payments: { orderBy: { paidAt: "desc" }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async updateStatus(razorpaySubscriptionId: string, data: {
    status: string;
    paidCount?: number;
    currentStart?: Date | null;
    currentEnd?: Date | null;
    chargeAt?: Date | null;
  }) {
    return prisma.razorpaySubscription.update({
      where: { razorpaySubscriptionId },
      data,
    });
  },

  // ── Razorpay Payments ─────────────────────────────────────────────────────
  async recordPayment(data: {
    businessId: string;
    razorpaySubscriptionId: string;
    razorpayPaymentId: string;
    amount: number;
    currency: string;
    status: string;
    invoiceId?: string;
    paidAt: Date;
  }) {
    return prisma.razorpayPayment.create({ data });
  },

  async findPaymentByRazorpayId(razorpayPaymentId: string) {
    return prisma.razorpayPayment.findUnique({ where: { razorpayPaymentId } });
  },
};
