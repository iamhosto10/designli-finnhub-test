import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { AppError } from "../middleware/AppError.js";
import { sendSuccess } from "../utils/response.js";
import { LoginInput, RegisterInput } from "../middleware/validationSchemas.js";

/**
 * Registers a new user with a hashed password.
 * Throws 409 if the email is already registered.
 */
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { email, password } = req.body as RegisterInput;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError("A user with this email already exists.", 409);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = new User({ email, passwordHash });
    await newUser.save();

    sendSuccess(res, null, 201, "Account created successfully.");
  } catch (error) {
    next(error);
  }
};

/**
 * Authenticates a user and returns a signed JWT token.
 * Also updates the FCM token on the user record if provided.
 */
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { email, password, fcmToken } = req.body as LoginInput;

    const user = await User.findOne({ email });
    if (!user) {
      throw new AppError("Invalid email or password.", 401);
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new AppError("Invalid email or password.", 401);
    }

    if (fcmToken) {
      user.fcmToken = fcmToken;
      await user.save();
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" },
    );

    sendSuccess(res, { token, userId: user._id, email: user.email });
  } catch (error) {
    next(error);
  }
};
