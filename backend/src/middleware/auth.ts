/**
 * Middleware that verifies the JWT token from the Authorization header.
 * Protects routes from unauthenticated access.
 *
 * Expected header format: Authorization: Bearer <token>
 */

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  user?: { userId: string };
}

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      error: "Unauthorized: no token provided.",
    });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      userId: string;
    };

    req.user = decoded;
    next();
  } catch {
    res.status(401).json({
      success: false,
      error: "Unauthorized: invalid or expired token.",
    });
  }
};
