import { Router } from "express";
import { authMiddleware, ownerOnly } from "../../../shared/middlewares";
import * as ctrl from "../controller";
const router = Router();
router.get(    "/",    authMiddleware, ownerOnly, ctrl.list);
router.post(   "/",    authMiddleware, ownerOnly, ctrl.invite);
router.patch(  "/:id", authMiddleware, ownerOnly, ctrl.updateRole);
router.delete( "/:id", authMiddleware, ownerOnly, ctrl.remove);
export default router;
