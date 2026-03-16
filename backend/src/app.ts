import express, { Application } from "express";
import helmet from "helmet";
import cors from "cors";
import path from "path";
import { env } from "./shared/config/env";
import { errorHandler } from "./shared/middlewares";

// ─── Module routers ───────────────────────────────────────────────────────────
import authRoutes          from "./modules/auth/routes";
import businessRoutes      from "./modules/business/routes";
import customerRoutes      from "./modules/customers/routes";
import itemRoutes          from "./modules/items/routes";
import invoiceRoutes       from "./modules/invoices/routes";
import paymentRoutes       from "./modules/payments/routes";
import subscriptionRoutes  from "./modules/subscriptions/routes";
import posRoutes           from "./modules/pos/routes";
import dashboardRoutes     from "./modules/dashboard/routes";
import staffRoutes         from "./modules/staff/routes";
import razorpayRoutes      from "./modules/razorpay/routes";
import webhookRoutes       from "./modules/webhooks/routes";

export function createApp(): Application {
  const app = express();

  // ── Security ──────────────────────────────────────────────────────────────
  app.use(helmet());
  app.use(cors({
    origin:      env.FRONTEND_URL,
    credentials: true,
  }));

  // ── Raw body capture for Razorpay webhook HMAC verification ───────────────
  app.use((req, _res, next) => {
    let raw = "";
    req.on("data", (chunk: Buffer) => { raw += chunk.toString(); });
    req.on("end", () => { (req as any).rawBody = raw; });
    next();
  });

  // ── Body parsing ──────────────────────────────────────────────────────────
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));

  // ── Static files ──────────────────────────────────────────────────────────
  app.use("/pdfs", express.static(path.join(process.cwd(), "pdfs")));

  // ── Health check ──────────────────────────────────────────────────────────
  app.get("/health", (_req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));

  // ── API routes ────────────────────────────────────────────────────────────
  app.use("/api/auth",          authRoutes);
  app.use("/api/businesses",    businessRoutes);
  app.use("/api/customers",     customerRoutes);
  app.use("/api/items",         itemRoutes);
  app.use("/api/invoices",      invoiceRoutes);
  app.use("/api/payments",      paymentRoutes);
  app.use("/api/subscriptions", subscriptionRoutes);
  app.use("/api/pos",           posRoutes);
  app.use("/api/dashboard",     dashboardRoutes);
  app.use("/api/staff",         staffRoutes);
  app.use("/api/razorpay",      razorpayRoutes);
  app.use("/api/webhooks",      webhookRoutes);

  // ── Global error handler (must be last) ───────────────────────────────────
  app.use(errorHandler);

  return app;
}
