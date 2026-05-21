import WebSocket from "ws";
import { getMessaging } from "firebase-admin/messaging";
import Alert from "../models/Alert.js";
import * as admin from "firebase-admin";

export const initFinnhubWebSocket = () => {
  const token = process.env.FINNHUB_API_KEY;
  if (!token) {
    console.error("❌ Falta FINNHUB_API_KEY en el archivo .env");
    return;
  }

  const ws = new WebSocket(`wss://ws.finnhub.io?token=${token}`);

  ws.on("open", () => {
    console.log("📈 Conectado al WebSocket de Finnhub");

    ws.send(JSON.stringify({ type: "subscribe", symbol: "BINANCE:BTCUSDT" }));
    ws.send(JSON.stringify({ type: "subscribe", symbol: "BINANCE:ETHUSDT" }));
    ws.send(JSON.stringify({ type: "subscribe", symbol: "BINANCE:SOLUSDT" }));
    ws.send(JSON.stringify({ type: "subscribe", symbol: "BINANCE:BNBUSDT" }));
  });

  ws.on("message", async (data: WebSocket.RawData) => {
    const response = JSON.parse(data.toString());

    // Finnhub envía los precios bajo el tipo 'trade'
    if (response.type === "trade") {
      for (const trade of response.data) {
        const { s: symbol, p: currentPrice } = trade;
        await checkAlerts(symbol, currentPrice);
      }
    }
  });

  ws.on("error", (error) => {
    console.error("❌ Error en WebSocket de Finnhub:", error);
  });

  ws.on("close", () => {
    console.log("🔌 Desconectado de Finnhub. Intentando reconectar en 5s...");
    setTimeout(initFinnhubWebSocket, 5000);
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
        `🚨 ¡ALERTA DISPARADA! ${symbol} alcanzó $${currentPrice} (Objetivo: $${lockedAlert.targetPrice})`,
      );

      const user: any = lockedAlert.userId;
      const fcmToken = user?.fcmToken;

      if (fcmToken) {
        const message = {
          notification: {
            title: "📈 ¡Objetivo Alcanzado!",
            body: `El activo ${symbol.replace("BINANCE:", "")} acaba de superar tu precio objetivo de $${lockedAlert.targetPrice}. Precio actual: $${currentPrice}`,
          },
          token: fcmToken,
        };

        try {
          const response = await getMessaging().send(message);
          console.log("✅ Notificación Push enviada con éxito:", response);
        } catch (pushError) {
          console.error("❌ Error enviando Notificación Push:", pushError);
        }
      } else {
        console.log(
          `⚠️ El usuario no tiene un fcmToken guardado. No se envió Push.`,
        );
      }
    }
  } catch (error) {
    console.error("Error verificando alertas:", error);
  }
};
