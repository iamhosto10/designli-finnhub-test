import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LineChart } from "react-native-gifted-charts";

interface ChartData {
  value: number;
  label: string;
}

interface SymbolConfig {
  symbol: string;
  shortLabel: string;
}

const screenWidth = Dimensions.get("window").width;
const MAX_DATA_POINTS = 20;
const CHART_UPDATE_INTERVAL_MS = 2000;
const MAX_RECONNECT_ATTEMPTS = 5;

const SYMBOLS: SymbolConfig[] = [
  { symbol: "BINANCE:BTCUSDT", shortLabel: "BTCUSDT" },
  { symbol: "BINANCE:ETHUSDT", shortLabel: "ETHUSDT" },
  { symbol: "BINANCE:SOLUSDT", shortLabel: "SOLUSDT" },
  { symbol: "BINANCE:BNBUSDT", shortLabel: "BNBUSDT" },
];

export default function StocksScreen() {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [activeSymbol, setActiveSymbol] = useState<SymbolConfig>(SYMBOLS[0]);

  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttempts = useRef<number>(0);
  const pendingPrice = useRef<number | null>(null);
  const chartUpdateTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const firstPrice = useRef<number | null>(null);

  const startChartUpdateTimer = useCallback(() => {
    chartUpdateTimer.current = setInterval(() => {
      if (pendingPrice.current === null) return;

      const price = pendingPrice.current;
      pendingPrice.current = null;

      const now = new Date();
      const timeString = `${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`;

      if (firstPrice.current === null) firstPrice.current = price;

      setCurrentPrice(price);
      setChartData((prev) => {
        const lastLabeled = [...prev].reverse().find((d) => d.label !== "");
        const label =
          !lastLabeled || lastLabeled.label !== timeString ? timeString : "";
        const next = [...prev, { value: price, label }];
        return next.length > MAX_DATA_POINTS
          ? next.slice(next.length - MAX_DATA_POINTS)
          : next;
      });
    }, CHART_UPDATE_INTERVAL_MS);
  }, []);

  useEffect(() => {
    setChartData([]);
    setCurrentPrice(0);
    reconnectAttempts.current = 0;
    firstPrice.current = null;
    pendingPrice.current = null;

    startChartUpdateTimer();

    const connectWebSocket = () => {
      const apiKey = process.env.EXPO_PUBLIC_FINNHUB_API_KEY;
      ws.current = new WebSocket(`wss://ws.finnhub.io?token=${apiKey}`);

      ws.current.onopen = () => {
        console.log(`📈 Conectado a Finnhub para ${activeSymbol.symbol}`);
        reconnectAttempts.current = 0;
        ws.current?.send(
          JSON.stringify({ type: "subscribe", symbol: activeSymbol.symbol }),
        );
      };

      ws.current.onmessage = (event) => {
        try {
          const response = JSON.parse(event.data);
          if (
            response.type === "trade" &&
            Array.isArray(response.data) &&
            response.data.length > 0
          ) {
            const latestTrade = response.data[response.data.length - 1];
            pendingPrice.current = latestTrade.p;
          }
        } catch (e) {
          console.warn("Failed to parse WS message", e);
        }
      };

      ws.current.onerror = (error) => {
        console.error("❌ Error en WebSocket:", error);
        ws.current?.close();
      };

      ws.current.onclose = () => {
        reconnectAttempts.current += 1;

        if (reconnectAttempts.current >= MAX_RECONNECT_ATTEMPTS) {
          console.warn(
            `🚫 Max reconnect attempts reached for ${activeSymbol.symbol}`,
          );
          return;
        }

        const delay = Math.min(3000 * reconnectAttempts.current, 15000);
        console.log(
          `🔌 Conexión perdida con ${activeSymbol.symbol}. Reconectando en ${delay / 1000}s...`,
        );
        reconnectTimeout.current = setTimeout(connectWebSocket, delay);
      };
    };

    connectWebSocket();

    return () => {
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
      if (chartUpdateTimer.current) clearInterval(chartUpdateTimer.current);
      if (ws.current) {
        ws.current.onclose = null;
        try {
          ws.current.send(
            JSON.stringify({
              type: "unsubscribe",
              symbol: activeSymbol.symbol,
            }),
          );
        } catch (_) {}
        ws.current.close();
        ws.current = null;
      }
    };
  }, [activeSymbol]);

  const chartMemo = React.useMemo(() => {
    if (chartData.length < 2) return null;
    const prices = chartData.map((d) => d.value);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const offset = minPrice > 10 ? minPrice - minPrice * 0.0001 : 0;
    const range = maxPrice - offset;
    const maxValue = range === 0 ? minPrice * 0.0002 : range * 1.5;
    const spacing = (screenWidth - 80) / Math.max(1, MAX_DATA_POINTS - 1);
    return { offset, maxValue, spacing };
  }, [chartData]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f4f4f5" }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text
          style={{
            fontSize: 24,
            fontWeight: "bold",
            color: "#18181b",
            marginBottom: 4,
          }}
        >
          Mercado en Vivo
        </Text>
        <Text style={{ color: "#71717a", marginBottom: 20 }}>
          Transacciones en tiempo real
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: 20 }}
        >
          {SYMBOLS.map((sym) => (
            <TouchableOpacity
              key={sym.symbol}
              onPress={() => setActiveSymbol(sym)}
              style={{
                marginRight: 12,
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: 20,
                backgroundColor:
                  activeSymbol.symbol === sym.symbol ? "#18181b" : "#ffffff",
                borderWidth: 1,
                borderColor: "#e4e4e7",
              }}
            >
              <Text
                style={{
                  fontWeight: "600",
                  color:
                    activeSymbol.symbol === sym.symbol ? "#ffffff" : "#52525b",
                }}
              >
                {sym.shortLabel}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View
          style={{
            backgroundColor: "#ffffff",
            borderRadius: 24,
            padding: 16,
            shadowColor: "#000",
            shadowOpacity: 0.05,
            shadowRadius: 10,
            elevation: 2,
          }}
        >
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 16, color: "#71717a", fontWeight: "500" }}>
              {activeSymbol.symbol.replace("BINANCE:", "")}
            </Text>
            <Text
              style={{ fontSize: 32, fontWeight: "bold", color: "#18181b" }}
            >
              ${currentPrice > 0 ? currentPrice.toFixed(2) : "---"}
            </Text>
          </View>

          {!chartMemo ? (
            <View
              style={{
                height: 220,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ActivityIndicator size="large" color="#3b82f6" />
              <Text style={{ color: "#a1a1aa", marginTop: 12, fontSize: 14 }}>
                {chartData.length === 1
                  ? "1 trade recibido, esperando..."
                  : "Esperando trades..."}
              </Text>
            </View>
          ) : (
            <View style={{ alignItems: "center", marginLeft: -10 }}>
              <LineChart
                data={chartData}
                height={200}
                width={screenWidth - 80}
                thickness={2}
                color="#3b82f6"
                showVerticalLines
                verticalLinesColor="#f4f4f5"
                rulesColor="#e4e4e7"
                yAxisColor="#e4e4e7"
                xAxisColor="#e4e4e7"
                yAxisTextStyle={{ color: "#a1a1aa", fontSize: 10 }}
                xAxisLabelTextStyle={{
                  color: "#a1a1aa",
                  fontSize: 9,
                  width: 60,
                  marginLeft: -10,
                }}
                yAxisLabelPrefix="$"
                yAxisOffset={chartMemo.offset}
                maxValue={chartMemo.maxValue}
                noOfSections={4}
                areaChart
                startFillColor="#3b82f6"
                endFillColor="#93c5fd"
                startOpacity={0.3}
                endOpacity={0.0}
                dataPointsColor="#1d4ed8"
                dataPointsRadius={3}
                spacing={chartMemo.spacing}
              />
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
