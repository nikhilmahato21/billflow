import { Request, Response, NextFunction } from "express";
import { itemService } from "../service";
import { CreateItemDto, UpdateItemDto } from "../dto";
export async function list(req: Request, res: Response, next: NextFunction) {
  try { res.json(await itemService.list(req.user!.businessId, req.query.grouped === "true")); } catch (e) { next(e); }
}
export async function create(req: Request, res: Response, next: NextFunction) {
  try { res.status(201).json(await itemService.create(req.user!.businessId, CreateItemDto.parse(req.body))); } catch (e) { next(e); }
}
export async function update(req: Request, res: Response, next: NextFunction) {
  try { res.json(await itemService.update(typeof req.params.id === "string" ? req.params.id : req.params.id[0], req.user!.businessId, UpdateItemDto.parse(req.body))); } catch (e) { next(e); }
}
export async function remove(req: Request, res: Response, next: NextFunction) {
  try { await itemService.delete(typeof req.params.id === "string" ? req.params.id : req.params.id[0], req.user!.businessId); res.status(204).send(); } catch (e) { next(e); }
}
