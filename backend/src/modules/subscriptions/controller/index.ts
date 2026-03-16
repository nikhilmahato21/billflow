import { Request, Response, NextFunction } from "express";
import { subscriptionService } from "../service";
import { CreateSubscriptionDto, UpdateSubscriptionDto } from "../dto";

export async function list(req: Request, res: Response, next: NextFunction) {
  try { res.json(await subscriptionService.list(req.user!.businessId)); } catch (e) { next(e); }
}
export async function create(req: Request, res: Response, next: NextFunction) {
  try { res.status(201).json(await subscriptionService.create(req.user!.businessId, CreateSubscriptionDto.parse(req.body))); }
  catch (e) { next(e); }
}
export async function update(req: Request, res: Response, next: NextFunction) {
  try { res.json(await subscriptionService.update(typeof req.params.id === "string" ? req.params.id : req.params.id[0], req.user!.businessId, UpdateSubscriptionDto.parse(req.body))); }
  catch (e) { next(e); }
}
