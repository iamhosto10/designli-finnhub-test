import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/authRoutes.js";
import alertRoutes from "./routes/alertRoutes.js";
import { initFinnhubWebSocket, checkAlerts } from "./services/finnhub.js";
import {
  notFoundHandler,
  globalErrorHandler,
} from "./middleware/errorHandler.js";
import "./queues/notificationQueue.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serviceAccountPath = process.env.RENDER
  ? "/etc/secrets/firebase-service-account.json"
  : path.resolve(__dirname, "../firebase-service-account.json");

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/alerts", alertRoutes);

app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "Server is running successfully." });
});

/**
 * Simulation endpoint for testing push notifications without relying
 * on Finnhub's real-time data or free-tier rate limits.
 *
 * @example
 * curl -X POST http://localhost:3000/api/alerts/simulate-price \
 *   -H "Content-Type: application/json" \
 *   -d '{"symbol":"BINANCE:BTCUSDT", "price": 200000}'
 */
app.post("/api/alerts/simulate-price", async (req, res, next) => {
  try {
    const { symbol, price } = req.body;
    console.log(`🔮 Simulating price for ${symbol}: $${price}`);
    await checkAlerts(symbol, Number(price));
    res.json({
      success: true,
      message: `Simulation executed for ${symbol} at $${price}`,
    });
  } catch (error) {
    next(error);
  }
});

// ─── Error Handling ───────────────────────────────────────────────────────────
// Order matters: notFoundHandler must come after all routes,
// globalErrorHandler must always be the very last middleware registered.
app.use(notFoundHandler);
app.use(globalErrorHandler);

// ─── Server Bootstrap ─────────────────────────────────────────────────────────
const startServer = async () => {
  try {
    const mongoUri = process.env.MONGO_URI as string;
    await mongoose.connect(mongoUri);
    console.log("📦 Connected to MongoDB successfully.");

    initFinnhubWebSocket();

    app.listen(PORT as number, "0.0.0.0", () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("💥 Failed to connect to the database:", error);
    process.exit(1);
  }
};

startServer();
