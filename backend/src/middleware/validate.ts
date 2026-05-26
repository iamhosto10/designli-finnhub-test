import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

/**
 * Reusable middleware factory that validates req.body against a Zod schema.
 * If validation fails, responds with 400 and a list of specific field errors.
 * If validation passes, replaces req.body with the parsed (sanitized) data.
 *
 * @example
 * router.post("/register", validate(registerSchema), register);
 */
export const validate =
  (schema: ZodSchema) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = (result.error as ZodError).errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      }));

      res.status(400).json({
        success: false,
        error: "Validation failed.",
        details: errors,
      });
      return;
    }

    // Replace req.body with sanitized and typed data from Zod
    req.body = result.data;
    next();
  };
