import { Router } from "express";
import { authMiddleware, ownerOnly, anyRole } from "../../../shared/middlewares";
import { checkRazorpaySubAccess } from "../../../shared/middlewares/planLimits";
import * as ctrl from "../controller";

const router = Router();

// ─── Plans ────────────────────────────────────────────────────────────────────
router.get(   "/plans",               authMiddleware, anyRole,      ctrl.listPlans);
router.post(  "/plans",               authMiddleware, ownerOnly, checkRazorpaySubAccess, ctrl.createPlan);
router.post(  "/plans/item/:itemId",  authMiddleware, ownerOnly, checkRazorpaySubAccess, ctrl.createPlanForItem);

// ─── Subscriptions ────────────────────────────────────────────────────────────
router.get(   "/subscriptions",               authMiddleware, anyRole,   ctrl.listSubscriptions);
router.post(  "/subscriptions",               authMiddleware, ownerOnly, checkRazorpaySubAccess, ctrl.createSubscription);
router.get(   "/subscriptions/:id",           authMiddleware, anyRole,   ctrl.getSubscription);
router.post(  "/subscriptions/:id/cancel",    authMiddleware, ownerOnly, ctrl.cancelSubscription);
router.post(  "/subscriptions/:id/pause",     authMiddleware, ownerOnly, ctrl.pauseSubscription);
router.post(  "/subscriptions/:id/resume",    authMiddleware, ownerOnly, ctrl.resumeSubscription);
router.post(  "/subscriptions/:id/sync",      authMiddleware, ownerOnly, ctrl.syncSubscription);

// ─── Payment verification ─────────────────────────────────────────────────────
router.post(  "/verify-payment",  authMiddleware, anyRole, ctrl.verifyPayment);

// ─── Webhook (no auth — verified by HMAC) ────────────────────────────────────
router.post(  "/webhook", ctrl.handleWebhook);

export default router;
