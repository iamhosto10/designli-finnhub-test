import { Response } from "express";

/**
 * Sends a standardized success response.
 * All successful responses across the API share this exact shape:
 * { success: true, data, message? }
 *
 * @example
 * sendSuccess(res, { token, userId }, 200);
 * sendSuccess(res, newAlert, 201);
 * sendSuccess(res, null, 200, "Account created successfully.");
 */
export const sendSuccess = (
  res: Response,
  data: unknown,
  statusCode = 200,
  message?: string,
): void => {
  res.status(statusCode).json({
    success: true,
    ...(message && { message }),
    data,
  });
};

/**
 * Sends a standardized error response.
 * Prefer throwing createError() and letting globalErrorHandler handle it.
 * Use this only when you need to send an error response directly.
 *
 * @example
 * sendError(res, "User not found", 404);
 */
export const sendError = (
  res: Response,
  error: string,
  statusCode = 500,
): void => {
  res.status(statusCode).json({
    success: false,
    error,
  });
};
