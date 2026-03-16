import { Request, Response, NextFunction } from "express";
import { dashboardService } from "../service";
export async function stats(req: Request, res: Response, next: NextFunction) {
  try { res.json(await dashboardService.getStats(req.user!.businessId)); } catch (e) { next(e); }
}
export async function revenue(req: Request, res: Response, next: NextFunction) {
  try { res.json(await dashboardService.getRevenueChart(req.user!.businessId)); } catch (e) { next(e); }
}
