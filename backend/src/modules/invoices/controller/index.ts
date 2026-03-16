import { Request, Response, NextFunction } from "express";
import { invoiceService } from "../service";
import { CreateInvoiceDto, UpdateInvoiceStatusDto } from "../dto";

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const q = req.query as any;
    res.json(await invoiceService.list(req.user!.businessId, {
      status: q.status, customerId: q.customerId,
      page: q.page ? +q.page : undefined, limit: q.limit ? +q.limit : undefined,
    }));
  } catch (e) { next(e); }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try { res.status(201).json(await invoiceService.create(req.user!.businessId, CreateInvoiceDto.parse(req.body))); }
  catch (e) { next(e); }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try { res.json(await invoiceService.getById(typeof req.params.id === "string" ? req.params.id : req.params.id[0], req.user!.businessId)); }
  catch (e) { next(e); }
}

export async function updateStatus(req: Request, res: Response, next: NextFunction) {
  try { res.json(await invoiceService.updateStatus(typeof req.params.id === "string" ? req.params.id : req.params.id[0], req.user!.businessId, UpdateInvoiceStatusDto.parse(req.body))); }
  catch (e) { next(e); }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try { await invoiceService.delete(typeof req.params.id === "string" ? req.params.id : req.params.id[0], req.user!.businessId); res.status(204).send(); }
  catch (e) { next(e); }
}
