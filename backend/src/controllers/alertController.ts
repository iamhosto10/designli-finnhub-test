import { Response, NextFunction } from "express";
import Alert from "../models/Alert.js";
import { AuthRequest } from "../middleware/auth.js";
import { CreateAlertInput } from "../middleware/validationSchemas.js";
import { sendSuccess } from "../utils/response.js";
import { checkAlerts } from "../services/finnhub.js";

/**
 * Creates a new price alert for the authenticated user.
 * Input is already validated by the validate(createAlertSchema) middleware.
 * The userId is extracted from the JWT token — never from the request body.
 */
export const createAlert = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { symbol, targetPrice } = req.body as CreateAlertInput;

    const newAlert = new Alert({ userId, symbol, targetPrice });
    await newAlert.save();

    sendSuccess(res, newAlert, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Returns all active alerts belonging to the authenticated user.
 * Users can only access their own alerts — userId comes from the JWT token.
 */
export const getUserAlerts = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    const alerts = await Alert.find({ userId, isActive: true }).sort({
      createdAt: -1,
    });

    sendSuccess(res, alerts);
  } catch (error) {
    next(error);
  }
};

/**
 * Simulation endpoint for testing push notifications without relying
 * on Finnhub's real-time data or free-tier rate limits.
 *
 * @example
 * curl -X POST http://localhost:3000/api/alerts/simulate-price \
 *   -H "Content-Type: application/json" \
 *   -d '{"symbol":"BINANCE:BTCUSDT", "price": 200000}'
 */

export const simulatePrice = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { symbol, price } = req.body;
    console.log(`🔮 Simulating price for ${symbol}: $${price}`);
    await checkAlerts(symbol, Number(price));
    res.json({
      success: true,
      message: `Simulation executed for ${symbol} at $${price}`,
    });
    sendSuccess(
      res,
      null,
      200,
      `Simulation executed for ${symbol} at $${price}`,
    );
  } catch (error) {
    next(error);
  }
};
