import { prisma } from "../../../shared/prisma";
import { invoiceQueue, notificationQueue } from "../../../shared/queues";
import { generateInvoiceNumber } from "../../../shared/utils";
import { NotFoundError } from "../../../shared/errors";
import { PosCheckoutInput } from "../dto";

export const posService = {
  async checkout(businessId: string, data: PosCheckoutInput) {
    const itemIds = data.items.map(i => i.itemId);
    const dbItems = await prisma.item.findMany({ where: { id: { in: itemIds }, businessId } });
    if (dbItems.length !== itemIds.length) throw new NotFoundError("One or more items");

    const lineItems = data.items.map(li => {
      const item = dbItems.find((i: any) => i.id === li.itemId)!;
      const sub  = Number(item.price) * li.quantity;
      const tax  = (sub * Number(item.taxRate)) / 100;
      return { itemId: item.id, name: item.name, quantity: li.quantity, price: Number(item.price), taxRate: Number(item.taxRate), total: sub + tax };
    });

    const subtotal = lineItems.reduce((s, i) => s + i.price * i.quantity, 0);
    const taxAmt   = lineItems.reduce((s, i) => s + (i.price * i.quantity * i.taxRate) / 100, 0);
    const total    = subtotal + taxAmt;
    const num      = generateInvoiceNumber("POS");

    // Resolve or create walk-in customer
    let customerId = data.customerId;
    if (!customerId) {
      let walkIn = await prisma.customer.findFirst({ where: { businessId, name: "Walk-in Customer" } });
      if (!walkIn) walkIn = await prisma.customer.create({ data: { businessId, name: "Walk-in Customer" } });
      customerId = walkIn.id;
    }

    const invoice = await prisma.$transaction(async (tx: any) => {
      const inv = await tx.invoice.create({
        data: {
          businessId, customerId, invoiceNumber: num, status: "paid",
          subtotal, taxAmount: taxAmt, totalAmount: total, dueDate: new Date(),
          invoiceItems: { create: lineItems },
          payments: { create: [{ amount: total, method: data.paymentMethod, paidAt: new Date() }] },
        },
        include: { customer: true, invoiceItems: true },
      });
      await tx.business.update({ where: { id: businessId }, data: { invoicesThisMonth: { increment: 1 } } });
      return inv;
    });

    await invoiceQueue.add(`pos-pdf-${invoice.id}`, { invoiceId: invoice.id, businessId });

    if (invoice.customer.phone) {
      await notificationQueue.add(`pos-receipt-${invoice.id}`, {
        type: "whatsapp", businessId, customerId: invoice.customerId,
        invoiceId: invoice.id, template: "payment_received_v1", phone: invoice.customer.phone,
        variables: { "1": invoice.customer.name, "2": `₹${total.toFixed(2)}`, "3": businessId },
      }, { attempts: 3, backoff: { type: "exponential", delay: 5000 } });
    }

    return invoice;
  },
};
