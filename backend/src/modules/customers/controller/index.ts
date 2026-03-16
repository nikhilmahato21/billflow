import { Request, Response, NextFunction } from "express";
import { customerService } from "../service";
import { CreateCustomerDto, UpdateCustomerDto } from "../dto";

export async function list(req: Request, res: Response, next: NextFunction) {
  try { res.json(await customerService.list(req.user!.businessId, req.query.search as string)); }
  catch (e) { next(e); }
}
export async function create(req: Request, res: Response, next: NextFunction) {
  try { res.status(201).json(await customerService.create(req.user!.businessId, CreateCustomerDto.parse(req.body))); }
  catch (e) { next(e); }
}
export async function update(req: Request, res: Response, next: NextFunction) {
  try { res.json(await customerService.update(typeof req.params.id === "string" ? req.params.id : req.params.id[0], req.user!.businessId, UpdateCustomerDto.parse(req.body))); }
  catch (e) { next(e); }
}
export async function remove(req: Request, res: Response, next: NextFunction) {
  try { await customerService.delete(typeof req.params.id === "string" ? req.params.id : req.params.id[0], req.user!.businessId); res.status(204).send(); }
  catch (e) { next(e); }
}
