import { Request, Response, NextFunction } from "express";
import { prisma } from "../prisma";
import { getPlanLimits } from "../utils";
import { PlanLimitError } from "../errors";

type LimitKey = "invoicesPerMonth" | "clients" | "posMode" | "razorpaySubscriptions";

function checkLimit(key: LimitKey) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) { res.status(401).json({ error: "unauthorized" }); return; }
    try {
      const biz = await prisma.business.findUnique({
        where: { id: req.user.businessId },
        select: {
          plan: true,
          whatsappMsgsUsed: true,
          invoicesThisMonth: true,
          _count: { select: { customers: true } },
        },
      });
      if (!biz) { res.status(404).json({ error: "not_found" }); return; }

      const limits = getPlanLimits(biz.plan);

      if (key === "invoicesPerMonth") {
        const lim = limits.invoicesPerMonth;
        if (lim !== Infinity && biz.invoicesThisMonth >= lim) {
          throw new PlanLimitError(`Invoice limit of ${lim}/month reached. Upgrade your plan.`, key, biz.invoicesThisMonth, lim);
        }
      }
      if (key === "clients") {
        const lim = limits.clients;
        if (lim !== Infinity && biz._count.customers >= lim) {
          throw new PlanLimitError(`Client limit of ${lim} reached. Upgrade your plan.`, key, biz._count.customers, lim);
        }
      }
      if (key === "posMode" && !limits.posMode) {
        throw new PlanLimitError("POS mode requires Growth or Pro plan.", key, 0, 0);
      }
      if (key === "razorpaySubscriptions" && !limits.razorpaySubscriptions) {
        throw new PlanLimitError("Razorpay subscriptions require Growth or Pro plan.", key, 0, 0);
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

export const checkInvoiceLimit          = checkLimit("invoicesPerMonth");
export const checkClientLimit           = checkLimit("clients");
export const checkPosAccess             = checkLimit("posMode");
export const checkRazorpaySubAccess     = checkLimit("razorpaySubscriptions");
