import { prisma } from "../../../shared/prisma";
import { CreateInvoiceInput, ListInvoicesQuery } from "../dto";

export const invoiceRepository = {
  async create(businessId: string, data: CreateInvoiceInput, invoiceNumber: string) {
    const subtotal  = data.items.reduce((s, i) => s + i.price * i.quantity, 0);
    const taxAmount = data.items.reduce((s, i) => s + (i.price * i.quantity * i.taxRate) / 100, 0);
    const total     = subtotal + taxAmount;

    return prisma.$transaction(async (tx: any) => {
      const inv = await tx.invoice.create({
        data: {
          businessId,
          customerId:    data.customerId,
          invoiceNumber,
          status:        "pending",
          subtotal,
          taxAmount,
          totalAmount:   total,
          dueDate:       data.dueDate,
          notes:         data.notes,
          invoiceItems: {
            create: data.items.map(item => ({
              itemId:   item.itemId,
              name:     item.name,
              quantity: item.quantity,
              price:    item.price,
              taxRate:  item.taxRate,
              total:    item.price * item.quantity * (1 + item.taxRate / 100),
            })),
          },
        },
        include: { invoiceItems: true, customer: true },
      });
      await tx.business.update({
        where: { id: businessId },
        data:  { invoicesThisMonth: { increment: 1 } },
      });
      return inv;
    });
  },

  async findAll(businessId: string, query: ListInvoicesQuery) {
    const page  = query.page  || 1;
    const limit = query.limit || 20;
    const where = {
      businessId,
      ...(query.status     && { status:     query.status as any }),
      ...(query.customerId && { customerId: query.customerId }),
    };
    const [invoices, total] = await prisma.$transaction([
      prisma.invoice.findMany({
        where,
        include: {
          customer:    { select: { id: true, name: true, phone: true, email: true } },
          invoiceItems: true,
          payments:    true,
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.invoice.count({ where }),
    ]);
    return { invoices, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  async findById(id: string, businessId: string) {
    return prisma.invoice.findFirst({
      where: { id, businessId },
      include: {
        customer:     true,
        invoiceItems: { include: { item: true } },
        payments:     true,
        reminders:    true,
        business:     true,
      },
    });
  },

  async updateStatus(id: string, businessId: string, status: string) {
    return prisma.invoice.update({ where: { id, businessId }, data: { status: status as any } });
  },

  async updatePdfUrl(id: string, pdfUrl: string) {
    return prisma.invoice.update({ where: { id }, data: { pdfUrl } });
  },

  async delete(id: string, businessId: string) {
    return prisma.invoice.delete({ where: { id, businessId } });
  },
};
