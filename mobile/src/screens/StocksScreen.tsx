import React, { useEffect, useMemo } from "react";
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
import { useMarketStore, SYMBOLS } from "../store/useMarketStore";
import { useLogout } from "../hooks/useLogout";

const screenWidth = Dimensions.get("window").width;
const MAX_DATA_POINTS = 20;

const SYMBOL_COLORS: Record<string, string> = {
  "BINANCE:BTCUSDT": "#F7931A",
  "BINANCE:ETHUSDT": "#627EEA",
  "BINANCE:SOLUSDT": "#9945FF",
  "BINANCE:BNBUSDT": "#F3BA2F",
};

export default function StocksScreen() {
  const { handleLogout } = useLogout();

  const { activeSymbol, currentPrice, chartData, setActiveSymbol, connect } =
    useMarketStore();

  useEffect(() => {
    connect();
  }, []);

  const chartMemo = useMemo(() => {
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

  const priceChange = useMemo(() => {
    if (chartData.length < 2) return null;
    const first = chartData[0].value;
    const last = chartData[chartData.length - 1].value;
    const diff = last - first;
    const pct = (diff / first) * 100;
    return { diff, pct, positive: diff >= 0 };
  }, [chartData]);

  const accentColor = SYMBOL_COLORS[activeSymbol.symbol] || "#3b82f6";

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {/* Header */}
        <View className="flex-row justify-between items-center mb-6">
          <View>
            <Text className="text-white text-2xl font-bold tracking-tight">
              Live Market
            </Text>
            <Text className="text-slate-400 text-sm mt-0.5">
              Real-time trades
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleLogout}
            className="bg-red-950 border border-red-900 px-3 py-2 rounded-xl"
            activeOpacity={0.8}
          >
            <Text className="text-red-400 font-semibold text-xs">Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* Symbol selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-5"
          contentContainerStyle={{ gap: 10 }}
        >
          {SYMBOLS.map((sym) => {
            const isActive = activeSymbol.symbol === sym.symbol;
            const symColor = SYMBOL_COLORS[sym.symbol] || "#3b82f6";
            return (
              <TouchableOpacity
                key={sym.symbol}
                onPress={() => setActiveSymbol(sym)}
                activeOpacity={0.8}
                className={`px-4 py-2.5 rounded-2xl border flex-row items-center ${
                  isActive
                    ? "bg-slate-800 border-slate-600"
                    : "bg-slate-900 border-slate-800"
                }`}
              >
                <View
                  className="w-2 h-2 rounded-full mr-2"
                  style={{ backgroundColor: symColor }}
                />
                <Text
                  className={`text-sm font-semibold ${
                    isActive ? "text-white" : "text-slate-400"
                  }`}
                >
                  {sym.shortLabel}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Chart card */}
        <View className="bg-slate-900 rounded-3xl p-5 border border-slate-800">
          <View className="flex-row items-start justify-between mb-5">
            <View>
              <Text className="text-slate-400 text-xs uppercase tracking-widest font-semibold mb-1">
                {activeSymbol.symbol.replace("BINANCE:", "")}
              </Text>
              <Text className="text-white text-4xl font-bold tracking-tight">
                {currentPrice > 0
                  ? `$${currentPrice.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`
                  : "---"}
              </Text>
            </View>

            {priceChange && (
              <View
                className={`px-3 py-1.5 rounded-xl mt-1 ${
                  priceChange.positive
                    ? "bg-emerald-950 border border-emerald-900"
                    : "bg-red-950 border border-red-900"
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    priceChange.positive ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {priceChange.positive ? "▲" : "▼"}{" "}
                  {Math.abs(priceChange.pct).toFixed(2)}%
                </Text>
              </View>
            )}
          </View>

          {!chartMemo ? (
            <View className="h-52 items-center justify-center">
              <ActivityIndicator size="large" color="#3b82f6" />
              <Text className="text-slate-500 mt-3 text-sm">
                {chartData.length === 1
                  ? "1 trade received, waiting for more..."
                  : "Waiting for trades..."}
              </Text>
            </View>
          ) : (
            <View className="items-center" style={{ marginLeft: -10 }}>
              <LineChart
                data={chartData}
                height={200}
                width={screenWidth - 80}
                thickness={2}
                color={accentColor}
                showVerticalLines
                verticalLinesColor="#1e293b"
                rulesColor="#1e293b"
                yAxisColor="#1e293b"
                xAxisColor="#1e293b"
                yAxisTextStyle={{ color: "#475569", fontSize: 10 }}
                xAxisLabelTextStyle={{
                  color: "#475569",
                  fontSize: 9,
                  width: 60,
                  marginLeft: -10,
                }}
                yAxisLabelPrefix="$"
                yAxisOffset={chartMemo.offset}
                maxValue={chartMemo.maxValue}
                noOfSections={4}
                areaChart
                startFillColor={accentColor}
                endFillColor={accentColor}
                startOpacity={0.2}
                endOpacity={0.0}
                dataPointsColor={accentColor}
                dataPointsRadius={3}
                spacing={chartMemo.spacing}
              />
            </View>
          )}

          <View className="flex-row items-center mt-4 pt-4 border-t border-slate-800">
            <View className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-2" />
            <Text className="text-slate-500 text-xs font-medium">
              Live · WebSocket connected
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
