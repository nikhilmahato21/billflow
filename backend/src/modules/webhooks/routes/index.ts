import { Router } from "express";
import * as ctrl from "../controller";
const router = Router();
router.get("/whatsapp",  ctrl.whatsappVerify);
router.post("/whatsapp", ctrl.whatsappReceive);
export default router;
