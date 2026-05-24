import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

const AVAILABLE_SYMBOLS = [
  "BINANCE:BTCUSDT",
  "BINANCE:ETHUSDT",
  "BINANCE:SOLUSDT",
  "BINANCE:BNBUSDT",
];

const SYMBOL_COLORS: Record<string, string> = {
  "BINANCE:BTCUSDT": "#F7931A",
  "BINANCE:ETHUSDT": "#627EEA",
  "BINANCE:SOLUSDT": "#9945FF",
  "BINANCE:BNBUSDT": "#F3BA2F",
};

export default function AlertsScreen() {
  const [symbol, setSymbol] = useState(AVAILABLE_SYMBOLS[0]);
  const [targetPrice, setTargetPrice] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserId = async () => {
      const storedId = await AsyncStorage.getItem("userId");
      if (storedId) setUserId(storedId);
    };
    fetchUserId();
  }, []);

  const handleCreateAlert = async () => {
    if (!targetPrice.trim() || isNaN(Number(targetPrice))) {
      Alert.alert(
        "Invalid price",
        "Please enter a valid numeric target price.",
      );
      return;
    }

    setIsLoading(true);

    try {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL;

      const response = await fetch(`${apiUrl}/api/alerts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId,
          symbol: symbol,
          targetPrice: Number(targetPrice),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          "Alert Created!",
          `You'll be notified when ${symbol.replace("BINANCE:", "")} reaches $${targetPrice}`,
        );
        setTargetPrice("");
      } else {
        Alert.alert("Error", data.message || "Could not create alert");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Connection Error", "Could not connect to the server.");
    } finally {
      setIsLoading(false);
    }
  };

  const activeColor = SYMBOL_COLORS[symbol] || "#3b82f6";
  const shortLabel = symbol.replace("BINANCE:", "");

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ padding: 20 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="mb-6">
            <Text className="text-white text-2xl font-bold tracking-tight">
              Price Alerts
            </Text>
            <Text className="text-slate-400 text-sm mt-1">
              Get notified when your target is hit
            </Text>
          </View>

          <View className="flex-row items-center mb-6 bg-slate-900 rounded-2xl px-4 py-3 border border-slate-800">
            <View
              className="w-2.5 h-2.5 rounded-full mr-3"
              style={{ backgroundColor: activeColor }}
            />
            <Text className="text-white font-semibold text-base flex-1">
              {shortLabel}
            </Text>
            <Text className="text-slate-500 text-xs uppercase tracking-widest">
              Active asset
            </Text>
          </View>

          <View
            className="bg-slate-900 rounded-3xl p-5 border border-slate-800"
            style={{ zIndex: 10 }}
          >
            <View className="mb-5" style={{ zIndex: 50 }}>
              <Text className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-2">
                Asset to monitor
              </Text>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setIsDropdownOpen(!isDropdownOpen)}
                className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-4 flex-row justify-between items-center"
              >
                <View className="flex-row items-center gap-2.5">
                  <View
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: activeColor }}
                  />
                  <Text className="text-white text-base font-semibold ml-2">
                    {shortLabel}
                  </Text>
                </View>
                <Text className="text-slate-500 text-xs">
                  {isDropdownOpen ? "▲" : "▼"}
                </Text>
              </TouchableOpacity>

              {isDropdownOpen && (
                <View
                  className="absolute left-0 right-0 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden"
                  style={{ top: 76, zIndex: 100 }}
                >
                  {AVAILABLE_SYMBOLS.map((item, index) => {
                    const itemLabel = item.replace("BINANCE:", "");
                    const itemColor = SYMBOL_COLORS[item] || "#3b82f6";
                    const isActive = symbol === item;
                    return (
                      <TouchableOpacity
                        key={item}
                        className={`px-4 py-3.5 flex-row items-center ${
                          index !== AVAILABLE_SYMBOLS.length - 1
                            ? "border-b border-slate-700"
                            : ""
                        } ${isActive ? "bg-slate-700" : ""}`}
                        onPress={() => {
                          setSymbol(item);
                          setIsDropdownOpen(false);
                        }}
                      >
                        <View
                          className="w-2 h-2 rounded-full mr-3"
                          style={{ backgroundColor: itemColor }}
                        />
                        <Text
                          className={`text-base font-medium ${
                            isActive ? "text-white" : "text-slate-300"
                          }`}
                        >
                          {itemLabel}
                        </Text>
                        {isActive && (
                          <Text className="ml-auto text-blue-400 text-xs font-semibold">
                            Selected
                          </Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>

            <View className="mb-6">
              <Text className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-2">
                Target Price (USD)
              </Text>
              <View className="relative">
                <Text className="absolute left-4 top-4 text-slate-400 text-base z-10">
                  $
                </Text>
                <TextInput
                  className="bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-4 py-4 text-white text-base"
                  placeholder="0.00"
                  placeholderTextColor="#475569"
                  value={targetPrice}
                  onChangeText={setTargetPrice}
                  keyboardType="numeric"
                  onFocus={() => setIsDropdownOpen(false)}
                />
              </View>
            </View>

            <TouchableOpacity
              className={`rounded-xl py-4 items-center ${isLoading ? "bg-blue-400" : "bg-blue-500"}`}
              onPress={handleCreateAlert}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-white text-base font-bold tracking-wide">
                  Set Alert
                </Text>
              )}
            </TouchableOpacity>
          </View>
          <View className="mt-4 flex-row items-center px-1">
            <Text className="text-slate-600 text-xs leading-relaxed">
              🔔 Push notifications will be sent when the price target is
              reached.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
