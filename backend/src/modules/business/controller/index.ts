import { Request, Response, NextFunction } from "express";
import type { Prisma } from "../../../generated/prisma/client";
import { businessService } from "../service";
import { prisma } from "../../../shared/prisma";
import { z } from "zod";

export async function getById(req: Request, res: Response, next: NextFunction) {
  try { res.json(await businessService.getById(typeof req.params.id === "string" ? req.params.id : req.params.id[0], req.user!.businessId)); } catch (e) { next(e); }
}
export async function updateProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const data = z.object({ name: z.string().optional(), address: z.string().optional(), gstin: z.string().optional(), currency: z.string().optional(), logo: z.string().optional() }).parse(req.body);
    res.json(await businessService.updateProfile(req.user!.businessId, data));
  } catch (e) { next(e); }
}
export async function updateSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const { settings } = z.object({ settings: z.record(z.any()) }).parse(req.body);
    res.json(await businessService.updateSettings(req.user!.businessId, settings as Prisma.InputJsonObject));
  } catch (e) { next(e); }
}
export async function updateReminders(req: Request, res: Response, next: NextFunction) {
  try { res.json(await businessService.updateReminders(req.user!.businessId, req.body as Prisma.InputJsonObject)); } catch (e) { next(e); }
}
export async function updateTax(req: Request, res: Response, next: NextFunction) {
  try { res.json(await businessService.updateTax(req.user!.businessId, req.body as Prisma.InputJsonObject)); } catch (e) { next(e); }
}
export async function getTemplates(_req: Request, res: Response, next: NextFunction) {
  try { res.json(await prisma.businessTemplate.findMany({ include: { templateItems: true } })); } catch (e) { next(e); }
}
export async function applyTemplate(req: Request, res: Response, next: NextFunction) {
  try {
    const { templateSlug } = z.object({ templateSlug: z.string() }).parse(req.body);
    const tpl = await prisma.businessTemplate.findUnique({ where: { slug: templateSlug }, include: { templateItems: true } });
    if (!tpl) { res.status(404).json({ error: "not_found" }); return; }
    await prisma.$transaction(async (tx: any) => {
      await tx.business.update({ where: { id: req.user!.businessId }, data: { templateId: tpl.id, featuresEnabled: tpl.featuresEnabled, reminderConfig: tpl.reminderConfig } });
      const items = tpl.templateItems.filter((ti: any) => ti.name);
      if (items.length) {
        await tx.item.createMany({ data: items.map((ti: any) => ({ businessId: req.user!.businessId, name: ti.name, type: ti.type || "service", price: ti.defaultPrice ?? 0, taxRate: 0, category: ti.category })), skipDuplicates: true });
      }
    });
    res.json({ success: true });
  } catch (e) { next(e); }
}
export async function completeOnboarding(req: Request, res: Response, next: NextFunction) {
  try {
    const data = z.object({ name: z.string().optional(), address: z.string().optional(), gstin: z.string().optional(), currency: z.string().optional() }).parse(req.body);
    res.json(await businessService.completeOnboarding(req.user!.businessId, data));
  } catch (e) { next(e); }
}
