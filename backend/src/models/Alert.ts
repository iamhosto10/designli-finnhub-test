import mongoose, { Schema, Document } from "mongoose";

export interface IAlert extends Document {
  userId: mongoose.Types.ObjectId;
  symbol: string;
  targetPrice: number;
  isActive: boolean;
}

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
