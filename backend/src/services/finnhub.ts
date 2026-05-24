import WebSocket from "ws";
import { getMessaging } from "firebase-admin/messaging";
import Alert from "../models/Alert.js";
import * as admin from "firebase-admin";
import { notificationQueue } from "../queues/notificationQueue.js";

let reconnectTimeout: NodeJS.Timeout | null = null;

export const initFinnhubWebSocket = () => {
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }

  const token = process.env.FINNHUB_API_KEY;
  if (!token) {
    console.error("❌ Missing FINNHUB_API_KEY in the .env file");
    return;
  }

  const ws = new WebSocket(`wss://ws.finnhub.io?token=${token}`);

  ws.on("open", () => {
    console.log("📈 Connected to Finnhub WebSocket");

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
    console.error("❌ Error in Finnhub WebSocket:", error);
    ws.close();
  });

  ws.on("close", () => {
    reconnectTimeout = setTimeout(initFinnhubWebSocket, 5000);
  });
};

export const checkAlerts = async (symbol: string, currentPrice: number) => {
  try {
    const triggeredAlerts = await Alert.find({
      symbol: symbol,
      isActive: true,
      targetPrice: { $lte: currentPrice },
    });

    for (const alert of triggeredAlerts) {
      const lockedAlert = await Alert.findOneAndUpdate(
        { _id: alert._id, isActive: true },
        { $set: { isActive: false } },
        { new: true },
      ).populate("userId");

      if (!lockedAlert) {
        continue;
      }

      console.log(
        `🚨 Target Triggered! ${symbol} reached $${currentPrice} (Target: $${lockedAlert.targetPrice})`,
      );

      const user: any = lockedAlert.userId;
      const fcmToken = user?.fcmToken;

      if (fcmToken) {
        await notificationQueue.add(
          "send-push",
          {
            fcmToken,
            title: "📈 Target Reached!",
            body: `The asset ${symbol.replace("BINANCE:", "")} has just surpassed your target price of $${lockedAlert.targetPrice}. Current price: $${currentPrice}`,
          },
          {
            removeOnComplete: true,
            attempts: 3,
            backoff: {
              type: "fixed",
              delay: 5000,
            },
          },
        );

        console.log(
          `📱 Push notification queued for user ${user.email} with token ${fcmToken}`,
        );
      } else {
        console.log(
          `⚠️ The user does not have an fcmToken saved. Push notification not queued.`,
        );
      }
    }
  } catch (error) {
    console.error("Error checking alerts:", error);
  }
};
