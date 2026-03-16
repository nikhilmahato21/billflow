import { Request, Response } from "express";
import { webhookService } from "../service";

export function whatsappVerify(req: Request, res: Response) {
  const result = webhookService.verifyWhatsApp(
    req.query["hub.mode"]         as string,
    req.query["hub.verify_token"] as string,
    req.query["hub.challenge"]    as string,
  );
  result ? res.status(200).send(result) : res.status(403).send("Forbidden");
}

export function whatsappReceive(req: Request, res: Response) {
  webhookService.handleWhatsAppEvent(req.body);
  res.status(200).send("OK");
}
