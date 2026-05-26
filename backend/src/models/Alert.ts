import mongoose, { Schema, Document } from "mongoose";

/**
 * TypeScript interface representing an Alert document in MongoDB.
 * Extends Mongoose's Document to include all built-in document methods.
 */
export interface IAlert extends Document {
  /** Reference to the User who created this alert. */
  userId: mongoose.Types.ObjectId;
  /** Trading symbol in Finnhub format (e.g. "BINANCE:BTCUSDT"). */
  symbol: string;
  /** The price at which the user wants to be notified. */
  targetPrice: number;
  /**
   * Whether the alert is still active and should be evaluated.
   * Set to false atomically once triggered to prevent duplicate notifications.
   */
  isActive: boolean;
}

/**
 * Mongoose schema for price alerts.
 *
 * Key design decisions:
 * - `symbol` is stored in uppercase to ensure consistent matching
 *   against Finnhub trade data regardless of input casing.
 * - `isActive` defaults to true and is set to false atomically
 *   via findOneAndUpdate to prevent race conditions on concurrent
 *   WebSocket trade events.
 * - `timestamps: true` adds createdAt and updatedAt fields automatically.
 */
const AlertSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    symbol: { type: String, required: true, uppercase: true },
    targetPrice: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export default mongoose.model<IAlert>("Alert", AlertSchema);
