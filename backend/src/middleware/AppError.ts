/**
 * Custom error class that extends the native Error.
 * Allows throwing errors with a specific HTTP status code
 * and a clean message anywhere in the application.
 *
 * @example
 * throw new AppError("User not found", 404);
 * throw new AppError("Invalid credentials", 401);
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;

    // Operational errors are expected (validation, auth, not found).
    // Non-operational errors are bugs — unhandled, unexpected failures.
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}
