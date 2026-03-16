import { prisma } from "../../../shared/prisma";
import { CreateSubscriptionInput, UpdateSubscriptionInput } from "../dto";
import { nextBillingDate } from "../../../shared/utils";

export const subscriptionRepository = {
  async findAll(businessId: string) {
    return prisma.subscription.findMany({
      where:   { businessId },
      include: {
        customer: { select: { id: true, name: true, phone: true, email: true } },
        item:     { select: { id: true, name: true, price: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async create(businessId: string, data: CreateSubscriptionInput) {
    const next = nextBillingDate(data.startDate, data.billingCycle);
    return prisma.subscription.create({
      data: { businessId, ...data, nextBillingAt: next } as any,
      include: { customer: true, item: true },
    });
  },

  async update(id: string, businessId: string, data: UpdateSubscriptionInput) {
    return prisma.subscription.update({ where: { id, businessId }, data: data as any });
  },
};
