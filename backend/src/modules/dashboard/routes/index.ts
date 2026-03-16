import { Router } from "express";
import { authMiddleware, anyRole } from "../../../shared/middlewares";
import * as ctrl from "../controller";
const router = Router();
router.get("/stats",   authMiddleware, anyRole, ctrl.stats);
router.get("/revenue", authMiddleware, anyRole, ctrl.revenue);
export default router;
