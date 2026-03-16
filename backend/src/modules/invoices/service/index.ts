import { invoiceRepository } from "../repository";
import { CreateInvoiceInput, ListInvoicesQuery, UpdateInvoiceStatusInput } from "../dto";
import { NotFoundError } from "../../../shared/errors";
import { generateInvoiceNumber, msUntil } from "../../../shared/utils";
import { invoiceQueue, notificationQueue, reminderQueue } from "../../../shared/queues";
import { prisma } from "../../../shared/prisma";

export const invoiceService = {
  async create(businessId: string, data: CreateInvoiceInput) {
    const invoiceNumber = generateInvoiceNumber("INV");
    const invoice = await invoiceRepository.create(businessId, data, invoiceNumber);

    // Fire-and-forget: PDF generation
    await invoiceQueue.add(`pdf-${invoice.id}`, { invoiceId: invoice.id, businessId });

    // Schedule reminders based on business config
    await scheduleReminders(invoice.id, businessId, data.dueDate);

    return invoice;
  },

  async list(businessId: string, query: ListInvoicesQuery) {
    return invoiceRepository.findAll(businessId, query);
  },

  async getById(id: string, businessId: string) {
    const invoice = await invoiceRepository.findById(id, businessId);
    if (!invoice) throw new NotFoundError("Invoice");
    return invoice;
  },

  async updateStatus(id: string, businessId: string, data: UpdateInvoiceStatusInput) {
    const invoice = await invoiceRepository.findById(id, businessId);
    if (!invoice) throw new NotFoundError("Invoice");
    return invoiceRepository.updateStatus(id, businessId, data.status);
  },

  async delete(id: string, businessId: string) {
    const invoice = await invoiceRepository.findById(id, businessId);
    if (!invoice) throw new NotFoundError("Invoice");
    return invoiceRepository.delete(id, businessId);
  },
};

// ── Private ─────────────────────────────────────────────────────────────────

async function scheduleReminders(invoiceId: string, businessId: string, dueDate: Date) {
  const biz = await prisma.business.findUnique({
    where: { id: businessId },
    select: { reminderConfig: true, settingsOverride: true },
  });
  if (!biz) return;

  const config = biz.reminderConfig as any;
  const features = { ...(biz.settingsOverride as any) };
  if (!features.whatsapp_reminders && !config?.channel) return;

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: { customerId: true },
  });
  if (!invoice) return;

  const jobs: Array<{ type: string; delay: number }> = [];

  for (const days of (config?.before_due ?? [3, 1])) {
    const delay = msUntil(dueDate, -days);
    if (delay > 0) jobs.push({ type: `before_${days}`, delay });
  }
  if (config?.on_due !== false) {
    const delay = msUntil(dueDate, 0);
    if (delay >= 0) jobs.push({ type: "on_due", delay });
  }
  for (const days of (config?.after_due ?? [1, 3])) {
    const delay = msUntil(dueDate, days);
    jobs.push({ type: `after_${days}`, delay });
  }

  for (const job of jobs) {
    await reminderQueue.add(
      `reminder-${invoiceId}-${job.type}`,
      { invoiceId, businessId, customerId: invoice.customerId, reminderType: job.type, offsetDays: 0 },
      { delay: job.delay, attempts: 3, backoff: { type: "exponential", delay: 5000 } }
    );
    await prisma.reminder.create({
      data: {
        invoiceId,
        type:        job.type,
        scheduledAt: new Date(Date.now() + job.delay),
        status:      "pending",
        channel:     (config?.channel ?? "whatsapp") as any,
      },
    });
  }
}
