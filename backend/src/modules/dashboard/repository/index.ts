import { prisma } from "../../../shared/prisma";

export const dashboardRepository = {
  async getStats(businessId: string) {
    const now           = new Date();
    const startOfMonth  = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      revenueResult,
      pendingResult,
      overdueResult,
      customerCount,
      business,
      topItems,
    ] = await prisma.$transaction([
      prisma.invoice.aggregate({
        where: { businessId, status: "paid" },
        _sum:  { totalAmount: true },
      }),
      prisma.invoice.aggregate({
        where: { businessId, status: "pending" },
        _sum:  { totalAmount: true },
        _count: true,
      }),
      prisma.invoice.aggregate({
        where: { businessId, status: "overdue" },
        _sum:  { totalAmount: true },
        _count: true,
      }),
      prisma.customer.count({ where: { businessId } }),
      prisma.business.findUnique({
        where:  { id: businessId },
        select: { plan: true, whatsappMsgsUsed: true },
      }),
      prisma.invoiceItem.groupBy({
        by:    ["name"],
        where: { invoice: { businessId, status: "paid" } },
        _sum:  { total: true },
        orderBy: { _sum: { total: "desc" } },
        take: 5,
      }),
    ]);

    return { revenueResult, pendingResult, overdueResult, customerCount, business, topItems };
  },

  async getRevenueChart(businessId: string, months = 6) {
    const data: Array<{ month: string; revenue: number }> = [];
    for (let i = months - 1; i >= 0; i--) {
      const d     = new Date();
      d.setMonth(d.getMonth() - i);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end   = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      const result = await prisma.invoice.aggregate({
        where: { businessId, status: "paid", createdAt: { gte: start, lte: end } },
        _sum:  { totalAmount: true },
      });
      data.push({
        month:   start.toLocaleString("default", { month: "short", year: "2-digit" }),
        revenue: Number(result._sum.totalAmount ?? 0),
      });
    }
    return data;
  },
};
