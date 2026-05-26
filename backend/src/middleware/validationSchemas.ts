import { z } from "zod";

/**
 * Validation schema for user registration.
 * - email: must be a valid email format
 * - password: minimum 6 characters
 */
export const registerSchema = z.object({
  email: z.string().email("Must be a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

/**
 * Validation schema for user login.
 * Same rules as register plus optional fcmToken for push notifications.
 */
export const loginSchema = z.object({
  email: z.string().email("Must be a valid email address."),
  password: z.string().min(1, "Password is required."),
  fcmToken: z.string().optional(),
});

/**
 * Validation schema for creating a price alert.
 * - symbol: must be a non-empty string (e.g. "BINANCE:BTCUSDT")
 * - targetPrice: must be a positive number
 */
export const createAlertSchema = z.object({
  symbol: z.string().min(1, "Symbol is required."),
  targetPrice: z
    .number({ invalid_type_error: "'targetPrice' must be a number." })
    .positive("'targetPrice' must be a positive number."),
});

// Infer TypeScript types directly from the schemas — no duplication needed
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateAlertInput = z.infer<typeof createAlertSchema>;
