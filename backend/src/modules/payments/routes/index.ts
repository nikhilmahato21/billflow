import { Router } from "express";
import { authMiddleware, anyRole, canManagePayments } from "../../../shared/middlewares";
import * as ctrl from "../controller";

const router = Router();
// POST /api/payments
router.post(  "/",                     authMiddleware, canManagePayments, ctrl.record);
// GET  /api/invoices/:invoiceId/payments  (mounted by invoices router parent)
router.get(   "/invoices/:invoiceId/payments", authMiddleware, anyRole, ctrl.listForInvoice);
export default router;
