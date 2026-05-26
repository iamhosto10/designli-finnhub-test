import mongoose, { Schema, Document } from "mongoose";

/**
 * TypeScript interface representing a User document in MongoDB.
 * Extends Mongoose's Document to include all built-in document methods.
 */
export interface IUser extends Document {
  /** Unique email address used for authentication. */
  email: string;
  /** Bcrypt-hashed password. The plain-text password is never stored. */
  passwordHash: string;
  /**
   * Firebase Cloud Messaging device token.
   * Captured on login and used to deliver targeted push notifications
   * when a price alert is triggered. Optional because it is only
   * available after the user grants notification permissions.
   */
  fcmToken?: string;
}

/**
 * Mongoose schema for users.
 *
 * Key design decisions:
 * - `email` is unique at the database level to prevent duplicate accounts,
 *   and is also validated at the application level via Zod before reaching
 *   the database.
 * - `passwordHash` stores only the bcrypt hash — never the plain-text password.
 * - `fcmToken` is updated on every login to ensure the stored token always
 *   reflects the current device, handling cases where the token is rotated
 *   by Firebase or the user reinstalls the app.
 * - `timestamps: true` adds createdAt and updatedAt fields automatically.
 */
const UserSchema: Schema = new Schema(
  {
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    fcmToken: { type: String },
  },
  { timestamps: true },
);

export default mongoose.model<IUser>("User", UserSchema);
