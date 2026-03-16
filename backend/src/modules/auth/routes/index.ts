import { Router } from "express";
import rateLimit from "express-rate-limit";
import { authMiddleware, anyRole } from "../../../shared/middlewares";
import * as ctrl from "../controller";

const router = Router();
const limiter = rateLimit({ windowMs: 15 * 60_000, max: 10 });

router.post("/register", limiter, ctrl.register);
router.post("/login",    limiter, ctrl.login);
router.post("/refresh",          ctrl.refresh);
router.get( "/me",  authMiddleware, anyRole, ctrl.me);

export default router;
