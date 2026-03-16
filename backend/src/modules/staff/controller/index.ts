import { Request, Response, NextFunction } from "express";
import { staffService } from "../service";
import { z } from "zod";

export async function list(req: Request, res: Response, next: NextFunction) {
  try { res.json(await staffService.list(req.user!.businessId)); } catch (e) { next(e); }
}
export async function invite(req: Request, res: Response, next: NextFunction) {
  try {
    const data = z.object({ name: z.string().min(2), email: z.string().email(), password: z.string().min(8), role: z.enum(["staff","accountant"]) }).parse(req.body);
    res.status(201).json(await staffService.invite(req.user!.businessId, req.user!.userId, data));
  } catch (e) { next(e); }
}
export async function updateRole(req: Request, res: Response, next: NextFunction) {
  try {
    const { role } = z.object({ role: z.enum(["staff","accountant"]) }).parse(req.body);
    res.json(await staffService.updateRole(typeof req.params.id === "string" ? req.params.id : req.params.id[0], req.user!.businessId, req.user!.userId, role));
  } catch (e) { next(e); }
}
export async function remove(req: Request, res: Response, next: NextFunction) {
  try { await staffService.remove(typeof req.params.id === "string" ? req.params.id : req.params.id[0], req.user!.businessId, req.user!.userId); res.status(204).send(); }
  catch (e) { next(e); }
}
