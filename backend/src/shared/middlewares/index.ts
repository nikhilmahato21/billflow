import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ZodError } from "zod";
import { env } from "../config/env";
import { AppError, ForbiddenError, UnauthorizedError } from "../errors";
import { AuthUser } from "../types";

// ─── JWT Auth ─────────────────────────────────────────────────────────────────
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "unauthorized", message: "No token provided" });
    return;
  }
  try {
    req.user = jwt.verify(header.split(" ")[1], env.JWT_SECRET) as AuthUser;
    next();
  } catch {
    res.status(401).json({ error: "unauthorized", message: "Invalid or expired token" });
  }
}

// ─── Role constants ───────────────────────────────────────────────────────────
const R = { OWNER: "owner", STAFF: "staff", ACCOUNTANT: "accountant" } as const;

function roleGuard(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) { res.status(401).json({ error: "unauthorized" }); return; }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        error: "forbidden",
        message: `Requires one of: ${roles.join(", ")}. Your role: ${req.user.role}`,
        requiredRoles: roles,
        yourRole: req.user.role,
      });
      return;
    }
    next();
  };
}

export const ownerOnly         = roleGuard(R.OWNER);
export const canWrite          = roleGuard(R.OWNER, R.STAFF);
export const canManagePayments = roleGuard(R.OWNER, R.ACCOUNTANT);
export const anyRole           = roleGuard(R.OWNER, R.STAFF, R.ACCOUNTANT);
export const canUsePOS         = roleGuard(R.OWNER, R.STAFF);

// ─── Business ownership guard ────────────────────────────────────────────────
export function ownBusiness(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) { res.status(401).json({ error: "unauthorized" }); return; }
  if (req.params.id && req.params.id !== req.user.businessId) {
    res.status(403).json({ error: "forbidden", message: "Access denied to this business" });
    return;
  }
  next();
}

// ─── Error handler ────────────────────────────────────────────────────────────
export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  console.error("[Error]", err.message);

  if (err instanceof AppError) {
    const body: Record<string, unknown> = {
      error: err.code,
      message: err.message,
    };
    // Attach plan limit extras
    if ((err as any).limitKey) {
      body.limitKey = (err as any).limitKey;
      body.current  = (err as any).current;
      body.limit    = (err as any).limit;
    }
    res.status(err.statusCode).json(body);
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({ error: "validation_error", message: "Invalid request data", details: err.flatten().fieldErrors });
    return;
  }

  // Prisma known errors (duck-typed)
  const prismaErr = err as any;
  if (prismaErr?.code === "P2002") { res.status(409).json({ error: "conflict", message: "Resource already exists" }); return; }
  if (prismaErr?.code === "P2025") { res.status(404).json({ error: "not_found", message: "Resource not found" }); return; }

  res.status(500).json({
    error: "internal_server_error",
    message: env.NODE_ENV === "production" ? "Something went wrong" : err.message,
  });
}
