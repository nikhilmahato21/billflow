import { Request, Response, NextFunction } from "express";
import { posService } from "../service";
import { PosCheckoutDto } from "../dto";

export async function checkout(req: Request, res: Response, next: NextFunction) {
  try { res.status(201).json(await posService.checkout(req.user!.businessId, PosCheckoutDto.parse(req.body))); }
  catch (e) { next(e); }
}
