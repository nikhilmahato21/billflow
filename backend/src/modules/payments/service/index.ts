import { paymentRepository } from "../repository";
import { prisma } from "../../../shared/prisma";
import { NotFoundError } from "../../../shared/errors";
import { RecordPaymentInput } from "../dto";

export const paymentService = {
  async record(businessId: string, data: RecordPaymentInput) {
    const invoice = await prisma.invoice.findFirst({ where: { id: data.invoiceId, businessId } });
    if (!invoice) throw new NotFoundError("Invoice");

    const payment = await paymentRepository.create(data);

    const totalPaid = await paymentRepository.totalPaidForInvoice(data.invoiceId);
    if (totalPaid >= Number(invoice.totalAmount)) {
      await prisma.invoice.update({ where: { id: data.invoiceId }, data: { status: "paid" } });
    }
    return payment;
  },

  async listForInvoice(invoiceId: string, businessId: string) {
    const invoice = await prisma.invoice.findFirst({ where: { id: invoiceId, businessId } });
    if (!invoice) throw new NotFoundError("Invoice");
    return paymentRepository.findByInvoice(invoiceId);
  },
};
