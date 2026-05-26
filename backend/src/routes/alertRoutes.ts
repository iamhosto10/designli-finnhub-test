import { Router } from "express";
import {
  createAlert,
  getUserAlerts,
  simulatePrice,
} from "../controllers/alertController.js";
import { authMiddleware } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { createAlertSchema } from "../middleware/validationSchemas.js";

const router = Router();

// All alert routes require a valid JWT token
router.post("/", authMiddleware, validate(createAlertSchema), createAlert);
router.get("/", authMiddleware, getUserAlerts);
router.post("/simulate-price", simulatePrice);

export default router;
