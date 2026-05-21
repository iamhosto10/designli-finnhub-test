import { Router } from "express";
import { createAlert, getUserAlerts } from "../controllers/alertController.js";

const router = Router();

router.post("/", createAlert);
router.get("/:userId", getUserAlerts);

export default router;
