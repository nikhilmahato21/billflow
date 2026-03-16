import { Router } from "express";
import { authMiddleware, anyRole, canWrite, ownerOnly } from "../../../shared/middlewares";
import { checkInvoiceLimit } from "../../../shared/middlewares/planLimits";
import * as ctrl from "../controller";

const router = Router();
router.get(    "/",           authMiddleware, anyRole,             ctrl.list);
router.post(   "/",           authMiddleware, canWrite,  checkInvoiceLimit, ctrl.create);
router.get(    "/:id",        authMiddleware, anyRole,             ctrl.getById);
router.patch(  "/:id/status", authMiddleware, canWrite,            ctrl.updateStatus);
router.delete( "/:id",        authMiddleware, ownerOnly,           ctrl.remove);
export default router;
