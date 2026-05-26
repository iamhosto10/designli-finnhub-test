import WebSocket from "ws";
import Alert from "../models/Alert.js";
import { notificationQueue } from "../queues/notificationQueue.js";

let reconnectTimeout: NodeJS.Timeout | null = null;

/**
 * Initializes the Finnhub WebSocket connection and subscribes to
 * all tracked trading symbols. Implements auto-reconnect with a
 * 5-second delay on unexpected disconnections.
 */
export const initFinnhubWebSocket = () => {
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }

  const token = process.env.FINNHUB_API_KEY;
  if (!token) {
    console.error("❌ Missing FINNHUB_API_KEY in the .env file.");
    return;
  }

  const ws = new WebSocket(`wss://ws.finnhub.io?token=${token}`);

  ws.on("open", () => {
    console.log("📈 Connected to Finnhub WebSocket.");
    ws.send(JSON.stringify({ type: "subscribe", symbol: "BINANCE:BTCUSDT" }));
    ws.send(JSON.stringify({ type: "subscribe", symbol: "BINANCE:ETHUSDT" }));
    ws.send(JSON.stringify({ type: "subscribe", symbol: "BINANCE:SOLUSDT" }));
    ws.send(JSON.stringify({ type: "subscribe", symbol: "BINANCE:BNBUSDT" }));
  });

  ws.on("message", async (data: WebSocket.RawData) => {
    const response = JSON.parse(data.toString());

    if (response.type === "trade") {
      for (const trade of response.data) {
        const { s: symbol, p: currentPrice } = trade;
        await checkAlerts(symbol, currentPrice);
      }
    }
  });

  ws.on("error", (error) => {
    console.error("❌ Finnhub WebSocket error:", error);
    ws.close();
  });

  ws.on("close", () => {
    console.warn("🔌 Finnhub WebSocket closed. Reconnecting in 5s...");
    reconnectTimeout = setTimeout(initFinnhubWebSocket, 5000);
  });
};

/**
 * Evaluates all active alerts for a given symbol against the current price.
 * Uses an atomic findOneAndUpdate to prevent duplicate notifications
 * caused by concurrent trade events hitting the same alert.
 */
export const checkAlerts = async (symbol: string, currentPrice: number) => {
  try {
    const triggeredAlerts = await Alert.find({
      symbol,
      isActive: true,
      targetPrice: { $lte: currentPrice },
    });

    for (const alert of triggeredAlerts) {
      // Atomically lock the alert to prevent race conditions
      const lockedAlert = await Alert.findOneAndUpdate(
        { _id: alert._id, isActive: true },
        { $set: { isActive: false } },
        { new: true },
      ).populate("userId");

      if (!lockedAlert) continue;

      console.log(
        `🚨 Alert triggered: ${symbol} reached $${currentPrice} (target: $${lockedAlert.targetPrice})`,
      );

      const user = lockedAlert.userId as any;
      const fcmToken = user?.fcmToken;

      if (fcmToken) {
        await notificationQueue.add(
          "send-push",
          {
            fcmToken,
            title: "📈 Target Reached!",
            body: `${symbol.replace("BINANCE:", "")} surpassed your target of $${lockedAlert.targetPrice}. Current price: $${currentPrice}`,
          },
          {
            removeOnComplete: true,
            attempts: 3,
            backoff: { type: "fixed", delay: 5000 },
          },
        );
        console.log(`📱 Push notification queued for ${user.email}.`);
      } else {
        console.warn(
          `⚠️ No FCM token found for user ${user.email}. Skipping push.`,
        );
      }
    }
  } catch (error) {
    console.error("❌ Error checking alerts:", error);
  }
};
