import { prisma } from "../../../shared/prisma";
import { RecordPaymentInput } from "../dto";

export const paymentRepository = {
  async create(data: RecordPaymentInput) {
    return prisma.payment.create({ data: data as any });
  },
  async findByInvoice(invoiceId: string) {
    return prisma.payment.findMany({ where: { invoiceId }, orderBy: { paidAt: "desc" } });
  },
  async totalPaidForInvoice(invoiceId: string): Promise<number> {
    const result = await prisma.payment.aggregate({
      where: { invoiceId }, _sum: { amount: true },
    });
    return Number(result._sum.amount ?? 0);
  },
};
