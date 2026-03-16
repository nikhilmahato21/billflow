import { Router } from "express";
import { authMiddleware, canUsePOS } from "../../../shared/middlewares";
import { checkPosAccess } from "../../../shared/middlewares/planLimits";
import * as ctrl from "../controller";
const router = Router();
router.post("/checkout", authMiddleware, canUsePOS, checkPosAccess, ctrl.checkout);
export default router;
