import { Worker, Job } from "bullmq";
import { bullMQConnection } from "../redis";
import { prisma } from "../prisma";
import { NotificationJobData } from "../queues";
import { getPlanLimits } from "../utils";

async function sendWhatsApp(to: string, templateName: string, variables: string[]): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const phoneId = process.env.WA_PHONE_ID;
  const token   = process.env.WA_TOKEN;
  if (!phoneId || !token) return { success: false, error: "WhatsApp not configured" };

  try {
    const resp = await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: to.replace(/\D/g, ""),
        type: "template",
        template: { name: templateName, language: { code: "en_US" }, components: [{ type: "body", parameters: variables.map(v => ({ type: "text", text: v })) }] },
      }),
    });
    const data = await resp.json() as any;
    return resp.ok ? { success: true, messageId: data.messages?.[0]?.id } : { success: false, error: data.error?.message };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export const notificationWorker = new Worker<NotificationJobData>(
  "notifications",
  async (job: Job<NotificationJobData>) => {
    const { businessId, customerId, invoiceId, template, phone, variables } = job.data;

    const biz = await prisma.business.findUnique({ where: { id: businessId }, select: { plan: true, whatsappMsgsUsed: true } });
    if (!biz) return;

    const limits = getPlanLimits(biz.plan);
    if (biz.whatsappMsgsUsed >= limits.whatsappMsgsPerMonth) {
      console.warn(`[notificationWorker] WhatsApp limit exceeded for business ${businessId}`);
      return;
    }

    if (job.data.type === "whatsapp" && phone) {
      const result = await sendWhatsApp(phone, template, Object.values(variables).slice(1));
      await prisma.reminderLog.create({
        data: { invoiceId, customerId, type: variables.type || "reminder", channel: "whatsapp", response: result as any },
      });
      if (result.success) {
        await prisma.business.update({ where: { id: businessId }, data: { whatsappMsgsUsed: { increment: 1 } } });
        await prisma.reminder.updateMany({ where: { invoiceId, status: "pending" }, data: { status: "sent", sentAt: new Date() } });
      } else {
        throw new Error(result.error ?? "WhatsApp send failed");
      }
    }
  },
  { ...bullMQConnection, concurrency: 5 }
);

notificationWorker.on("failed", (job, err) => console.error(`[notificationWorker] Job ${job?.id} failed:`, err.message));
