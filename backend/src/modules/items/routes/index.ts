import { Router } from "express";
import { authMiddleware, anyRole, canWrite, ownerOnly } from "../../../shared/middlewares";
import * as ctrl from "../controller";
const router = Router();
router.get(    "/",    authMiddleware, anyRole,  ctrl.list);
router.post(   "/",    authMiddleware, canWrite,  ctrl.create);
router.patch(  "/:id", authMiddleware, canWrite,  ctrl.update);
router.delete( "/:id", authMiddleware, ownerOnly, ctrl.remove);
export default router;
