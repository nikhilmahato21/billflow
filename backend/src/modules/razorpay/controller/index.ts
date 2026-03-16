import { Request, Response, NextFunction } from "express";
import { razorpayService } from "../service";
import { CreateRazorpayPlanDto, CreateRazorpaySubscriptionDto, VerifyPaymentDto, RazorpayWebhookPayload } from "../dto";

// ─── Plans ────────────────────────────────────────────────────────────────────

export async function createPlan(req: Request, res: Response, next: NextFunction) {
  try {
    const input = CreateRazorpayPlanDto.parse(req.body);
    const plan = await razorpayService.createPlan(req.user!.businessId, input);
    res.status(201).json(plan);
  } catch (err) { next(err); }
}

export async function createPlanForItem(req: Request, res: Response, next: NextFunction) {
  try {
    const itemId = typeof req.params.itemId === "string" ? req.params.itemId : req.params.itemId[0];
    const plan = await razorpayService.createPlanForItem(req.user!.businessId, itemId);
    res.status(201).json(plan);
  } catch (err) { next(err); }
}

export async function listPlans(req: Request, res: Response, next: NextFunction) {
  try {
    const plans = await razorpayService.listPlans(req.user!.businessId);
    res.json(plans);
  } catch (err) { next(err); }
}

// ─── Subscriptions ────────────────────────────────────────────────────────────

export async function createSubscription(req: Request, res: Response, next: NextFunction) {
  try {
    const input = CreateRazorpaySubscriptionDto.parse(req.body);
    const sub = await razorpayService.createSubscription(req.user!.businessId, input);
    res.status(201).json(sub);
  } catch (err) { next(err); }
}

export async function listSubscriptions(req: Request, res: Response, next: NextFunction) {
  try {
    const subs = await razorpayService.listSubscriptions(req.user!.businessId);
    res.json(subs);
  } catch (err) { next(err); }
}

export async function getSubscription(req: Request, res: Response, next: NextFunction) {
  try {
    const sub = await razorpayService.getSubscription(typeof req.params.id === "string" ? req.params.id : req.params.id[0], req.user!.businessId);
    res.json(sub);
  } catch (err) { next(err); }
}

export async function cancelSubscription(req: Request, res: Response, next: NextFunction) {
  try {
    const atCycleEnd = req.query.at_cycle_end === "true";
    const sub = await razorpayService.cancelSubscription(typeof req.params.id === "string" ? req.params.id : req.params.id[0], req.user!.businessId, atCycleEnd);
    res.json(sub);
  } catch (err) { next(err); }
}

export async function pauseSubscription(req: Request, res: Response, next: NextFunction) {
  try {
    const sub = await razorpayService.pauseSubscription(typeof req.params.id === "string" ? req.params.id : req.params.id[0], req.user!.businessId);
    res.json(sub);
  } catch (err) { next(err); }
}

export async function resumeSubscription(req: Request, res: Response, next: NextFunction) {
  try {
    const sub = await razorpayService.resumeSubscription(typeof req.params.id === "string" ? req.params.id : req.params.id[0], req.user!.businessId);
    res.json(sub);
  } catch (err) { next(err); }
}

export async function syncSubscription(req: Request, res: Response, next: NextFunction) {
  try {
    const sub = await razorpayService.syncFromRazorpay(typeof req.params.id === "string" ? req.params.id : req.params.id[0], req.user!.businessId);
    res.json(sub);
  } catch (err) { next(err); }
}

// ─── Payment verification ─────────────────────────────────────────────────────

export async function verifyPayment(req: Request, res: Response, next: NextFunction) {
  try {
    const input = VerifyPaymentDto.parse(req.body);
    const valid = await razorpayService.verifyPayment(input);
    if (!valid) { res.status(400).json({ error: "invalid_signature", message: "Payment verification failed" }); return; }
    res.json({ verified: true });
  } catch (err) { next(err); }
}

// ─── Webhook ──────────────────────────────────────────────────────────────────

export async function handleWebhook(req: Request, res: Response, next: NextFunction) {
  try {
    const signature = req.headers["x-razorpay-signature"] as string;
    const rawBody   = (req as any).rawBody as string;
    const payload   = req.body as RazorpayWebhookPayload;

    await razorpayService.handleWebhook(payload, signature, rawBody);
    res.json({ received: true });
  } catch (err) { next(err); }
}
