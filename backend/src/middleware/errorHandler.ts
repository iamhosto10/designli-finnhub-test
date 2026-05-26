import { Request, Response, NextFunction } from "express";
import { AppError } from "./AppError.js";

/**
 * Catches requests to routes that do not exist.
 * Must be registered after all valid routes in index.ts.
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  next(new AppError(`Route ${req.method} ${req.originalUrl} not found.`, 404));
};

/**
 * Global error handling middleware.
 * Catches every error thrown or passed via next(error) in the application.
 * Must be registered last in index.ts — after all routes and middleware.
 *
 * Distinguishes between:
 * - Operational errors (AppError): safe to expose message to client.
 * - Unexpected errors (bugs): log internally, return generic message.
 */
export const globalErrorHandler = (
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction,
): void => {
  // Operational error — thrown intentionally with AppError
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
    return;
  }

  // Unexpected error — log it internally, never expose details to client
  console.error("💥 Unexpected error:", err);

  res.status(500).json({
    success: false,
    error: "An unexpected internal server error occurred.",
  });
};
