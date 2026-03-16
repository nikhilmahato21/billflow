import { Request, Response, NextFunction } from "express";
import { paymentService } from "../service";
import { RecordPaymentDto } from "../dto";

export async function record(req: Request, res: Response, next: NextFunction) {
  try { res.status(201).json(await paymentService.record(req.user!.businessId, RecordPaymentDto.parse(req.body))); }
  catch (e) { next(e); }
}

export async function listForInvoice(req: Request, res: Response, next: NextFunction) {
  try { res.json(await paymentService.listForInvoice(typeof req.params.invoiceId === "string" ? req.params.invoiceId : req.params.invoiceId[0], req.user!.businessId)); }
  catch (e) { next(e); }
}
