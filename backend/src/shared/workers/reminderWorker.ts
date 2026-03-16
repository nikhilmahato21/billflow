import { Worker, Job } from "bullmq";
import { bullMQConnection } from "../redis";
import { prisma } from "../prisma";
import { notificationQueue, ReminderJobData } from "../queues";

export const reminderWorker = new Worker<ReminderJobData>(
  "reminders",
  async (job: Job<ReminderJobData>) => {
    const { invoiceId, businessId, customerId, reminderType } = job.data;
    const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId }, include: { customer: true, business: true } });
    if (!invoice || invoice.status === "paid") return;
    if (!invoice.customer.phone) return;

    await notificationQueue.add(`notif-${invoiceId}-${reminderType}`, {
      type: "whatsapp", businessId, customerId, invoiceId,
      template: "payment_reminder_v1",
      phone: invoice.customer.phone,
      variables: {
        type: reminderType,
        "1": invoice.customer.name,
        "2": `₹${Number(invoice.totalAmount).toFixed(2)}`,
        "3": invoice.business.name,
        "4": new Date(invoice.dueDate).toLocaleDateString("en-IN"),
      },
    }, { attempts: 3, backoff: { type: "exponential", delay: 5000 } });
  },
  { ...bullMQConnection, concurrency: 3 }
);

reminderWorker.on("failed", (job, err) => console.error(`[reminderWorker] Job ${job?.id} failed:`, err.message));
