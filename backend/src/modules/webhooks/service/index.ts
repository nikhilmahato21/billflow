import { env } from "../../../shared/config/env";

export const webhookService = {
  verifyWhatsApp(mode: string, token: string, challenge: string): string | null {
    if (mode === "subscribe" && token === env.WA_WEBHOOK_SECRET) return challenge;
    return null;
  },
  handleWhatsAppEvent(body: unknown): void {
    console.log("[WhatsApp Webhook]", JSON.stringify(body, null, 2));
  },
};
