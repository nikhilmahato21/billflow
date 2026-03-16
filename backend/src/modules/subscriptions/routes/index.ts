import { Router } from "express";
import { authMiddleware, anyRole, ownerOnly } from "../../../shared/middlewares";
import * as ctrl from "../controller";
const router = Router();
router.get(    "/",    authMiddleware, anyRole,    ctrl.list);
router.post(   "/",    authMiddleware, ownerOnly,  ctrl.create);
router.patch(  "/:id", authMiddleware, ownerOnly,  ctrl.update);
export default router;
