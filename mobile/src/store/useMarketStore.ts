import { create } from "zustand";

export interface ChartData {
  value: number;
  label: string;
}

export interface SymbolConfig {
  symbol: string;
  shortLabel: string;
}

interface MarketState {
  activeSymbol: SymbolConfig;
  currentPrice: number;
  chartData: ChartData[];
  isConnecting: boolean;
  setActiveSymbol: (sym: SymbolConfig) => void;
  connect: () => void;
  disconnect: () => void;
}

const MAX_DATA_POINTS = 20;
const CHART_UPDATE_INTERVAL_MS = 2000;
const MAX_RECONNECT_ATTEMPTS = 5;

export const SYMBOLS: SymbolConfig[] = [
  { symbol: "BINANCE:BTCUSDT", shortLabel: "BTCUSDT" },
  { symbol: "BINANCE:ETHUSDT", shortLabel: "ETHUSDT" },
  { symbol: "BINANCE:SOLUSDT", shortLabel: "SOLUSDT" },
  { symbol: "BINANCE:BNBUSDT", shortLabel: "BNBUSDT" },
];

let lastPriceUpdate = 0;
let ws: WebSocket | null = null;
let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
let chartUpdateTimer: ReturnType<typeof setInterval> | null = null;
let reconnectAttempts = 0;
let pendingPrice: number | null = null;
let firstPrice: number | null = null;

export const useMarketStore = create<MarketState>((set, get) => ({
  activeSymbol: SYMBOLS[0],
  currentPrice: 0,
  chartData: [],
  isConnecting: false,

  setActiveSymbol: (sym) => {
    if (get().activeSymbol.symbol === sym.symbol) return;
    set({ activeSymbol: sym, chartData: [], currentPrice: 0 });
    get().connect();
  },

  connect: () => {
    const { activeSymbol } = get();

    if (reconnectTimeout) clearTimeout(reconnectTimeout);
    if (chartUpdateTimer) clearInterval(chartUpdateTimer);
    if (ws) {
      ws.onclose = null;
      try {
        ws.send(
          JSON.stringify({ type: "unsubscribe", symbol: activeSymbol.symbol }),
        );
      } catch (_) {}
      ws.close();
      ws = null;
    }

    reconnectAttempts = 0;
    firstPrice = null;
    pendingPrice = null;
    set({ isConnecting: true });

    chartUpdateTimer = setInterval(() => {
      if (pendingPrice === null) return;

      const price = pendingPrice;
      pendingPrice = null;

      const now = new Date();
      const timeString = `${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`;

      if (firstPrice === null) firstPrice = price;

      set((state) => {
        const lastLabeled = [...state.chartData]
          .reverse()
          .find((d) => d.label !== "");
        const label =
          !lastLabeled || lastLabeled.label !== timeString ? timeString : "";
        const next = [...state.chartData, { value: price, label }];
        return {
          chartData:
            next.length > MAX_DATA_POINTS
              ? next.slice(next.length - MAX_DATA_POINTS)
              : next,
        };
      });
    }, CHART_UPDATE_INTERVAL_MS);

    const connectWebSocket = () => {
      const apiKey = process.env.EXPO_PUBLIC_FINNHUB_API_KEY;
      ws = new WebSocket(`wss://ws.finnhub.io?token=${apiKey}`);

      ws.onopen = () => {
        console.log(`📈 Connected to ${activeSymbol.symbol}`);
        reconnectAttempts = 0;
        set({ isConnecting: false });
        ws?.send(
          JSON.stringify({ type: "subscribe", symbol: activeSymbol.symbol }),
        );
      };

      ws.onmessage = (event) => {
        try {
          const response = JSON.parse(event.data);
          if (
            response.type === "trade" &&
            Array.isArray(response.data) &&
            response.data.length > 0
          ) {
            const latestTrade = response.data[response.data.length - 1];
            pendingPrice = latestTrade.p;

            const now = Date.now();
            if (now - lastPriceUpdate > 300) {
              set({ currentPrice: latestTrade.p });
              lastPriceUpdate = now;
            }
          }
        } catch (e) {
          console.warn("Failed to parse WebSocket message:", e);
        }
      };

      ws.onerror = (error) => {
        console.error("❌ WebSocket error:", error);
        ws?.close();
      };

      ws.onclose = () => {
        reconnectAttempts += 1;
        if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
          console.warn(
            `🚫 Max reconnect attempts reached for ${activeSymbol.symbol}.`,
          );
          set({ isConnecting: false });
          return;
        }
        const delay = Math.min(3000 * reconnectAttempts, 15000);
        console.log(`🔌 WebSocket closed. Reconnecting in ${delay / 1000}s...`);
        reconnectTimeout = setTimeout(connectWebSocket, delay);
      };
    };

    connectWebSocket();
  },

  disconnect: () => {
    if (reconnectTimeout) clearTimeout(reconnectTimeout);
    if (chartUpdateTimer) clearInterval(chartUpdateTimer);
    if (ws) {
      ws.onclose = null;
      ws.close();
      ws = null;
    }
  },
}));
