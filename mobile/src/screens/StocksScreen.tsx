import React, { useEffect, useState, useRef } from "react";
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

// Agregamos 'label' para mostrar la hora en el Eje X
interface ChartData {
  value: number;
  label: string;
}

const screenWidth = Dimensions.get("window").width;

export default function StocksScreen() {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [activeSymbol, setActiveSymbol] = useState<string>("BINANCE:BTCUSDT");
  const ws = useRef<WebSocket | null>(null);

  const symbols = [
    "BINANCE:BTCUSDT",
    "BINANCE:ETHUSDT",
    "BINANCE:LTCUSDT",
    "BINANCE:XRPUSDT",
  ];

  useEffect(() => {
    setChartData([]);
    setCurrentPrice(0);

    if (ws.current) {
      ws.current.close();
    }

    const apiKey = process.env.EXPO_PUBLIC_FINNHUB_API_KEY;
    ws.current = new WebSocket(`wss://ws.finnhub.io?token=${apiKey}`);

    ws.current.onopen = () => {
      ws.current?.send(
        JSON.stringify({ type: "subscribe", symbol: activeSymbol }),
      );
    };

    ws.current.onmessage = (event) => {
      const response = JSON.parse(event.data);

      if (response.type === "trade" && response.data) {
        const latestTrade = response.data[response.data.length - 1];
        const price = latestTrade.p;

        setCurrentPrice(price);

        // Capturamos la hora actual (ej. "22:49:05")
        const date = new Date();
        const timeString = `${date.getHours()}:${date.getMinutes() < 10 ? "0" : ""}${date.getMinutes()}:${date.getSeconds() < 10 ? "0" : ""}${date.getSeconds()}`;

        setChartData((prevData) => {
          const newDataPoint = { value: price, label: timeString };
          const updatedData = [...prevData, newDataPoint];

          if (updatedData.length > 20) {
            // Reducimos a 20 puntos para que el Eje X no se sature
            return updatedData.slice(updatedData.length - 20);
          }
          return updatedData;
        });
      }
    };

    return () => {
      if (ws.current) {
        ws.current.send(
          JSON.stringify({ type: "unsubscribe", symbol: activeSymbol }),
        );
        ws.current.close();
      }
    };
  }, [activeSymbol]);

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

        {/* Selector de Símbolos (Usando estilos en línea temporalmente por si NativeWind falla) */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: 20 }}
        >
          {symbols.map((sym) => (
            <TouchableOpacity
              key={sym}
              onPress={() => setActiveSymbol(sym)}
              style={{
                marginRight: 12,
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: 20,
                backgroundColor: activeSymbol === sym ? "#18181b" : "#ffffff",
                borderWidth: 1,
                borderColor: "#e4e4e7",
              }}
            >
              <Text
                style={{
                  fontWeight: "600",
                  color: activeSymbol === sym ? "#ffffff" : "#52525b",
                }}
              >
                {sym.replace("BINANCE:", "")}
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
              {activeSymbol.replace("BINANCE:", "")}
            </Text>
            <Text
              style={{ fontSize: 32, fontWeight: "bold", color: "#18181b" }}
            >
              ${currentPrice > 0 ? currentPrice.toFixed(2) : "---"}
            </Text>
          </View>

          {chartData.length < 2 ? (
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
              {(() => {
                const prices = chartData.map((d) => d.value);
                const minPrice = Math.min(...prices);
                const maxPrice = Math.max(...prices);

                // Ajustamos el offset para que la gráfica no sea una línea plana
                const offset = minPrice > 10 ? minPrice - minPrice * 0.0001 : 0;
                // Calculamos el rango visible
                const range = maxPrice - offset;
                const maxValue = range === 0 ? minPrice * 0.0002 : range * 1.5;

                return (
                  <LineChart
                    data={chartData}
                    height={200}
                    width={screenWidth - 80}
                    thickness={2}
                    color="#3b82f6"
                    // Configuraciones de los Ejes (¡Aquí está la magia que pedías!)
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
                    yAxisOffset={offset}
                    maxValue={maxValue}
                    noOfSections={4} // Divide el eje Y en 4 líneas horizontales
                    // Diseño del área
                    areaChart
                    startFillColor="#3b82f6"
                    endFillColor="#93c5fd"
                    startOpacity={0.3}
                    endOpacity={0.0}
                    // Puntos de datos visibles
                    dataPointsColor="#1d4ed8"
                    dataPointsRadius={3}
                    // Espaciado entre puntos para que respire
                    spacing={
                      (screenWidth - 80) / Math.max(1, chartData.length - 1)
                    }
                  />
                );
              })()}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
