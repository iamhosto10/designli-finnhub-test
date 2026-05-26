import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  FlatList,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCreateAlert, SYMBOL_COLORS } from "../hooks/useCreateAlert";
import { AlertItem } from "../services/alertsService";

// ─── Alert History Item ───────────────────────────────────────────────────────

const AlertHistoryItem = ({ item }: { item: AlertItem }) => {
  const color = SYMBOL_COLORS[item.symbol] || "#3b82f6";
  const shortSymbol = item.symbol.replace("BINANCE:", "");
  const date = new Date(item.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <View className="flex-row items-center py-3 border-b border-slate-800">
      <View
        className="w-2 h-2 rounded-full mr-3"
        style={{ backgroundColor: color }}
      />
      <View className="flex-1">
        <Text className="text-white font-semibold text-sm">{shortSymbol}</Text>
        <Text className="text-slate-500 text-xs mt-0.5">{date}</Text>
      </View>
      <View className="items-end">
        <Text className="text-white font-bold text-sm">
          ${item.targetPrice.toLocaleString("en-US")}
        </Text>
        <View className="flex-row items-center mt-0.5">
          <View className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1" />
          <Text className="text-emerald-400 text-xs font-medium">Active</Text>
        </View>
      </View>
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function AlertsScreen() {
  const {
    symbol,
    targetPrice,
    setTargetPrice,
    isLoading,
    isDropdownOpen,
    setIsDropdownOpen,
    handleCreateAlert,
    handleSelectSymbol,
    availableSymbols,
    alerts,
    isFetchingAlerts,
    fetchAlerts,
  } = useCreateAlert();

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
          refreshControl={
            <RefreshControl
              refreshing={isFetchingAlerts}
              onRefresh={fetchAlerts}
              tintColor="#3b82f6"
            />
          }
        >
          {/* Header */}
          <View className="mb-6">
            <Text className="text-white text-2xl font-bold tracking-tight">
              Price Alerts
            </Text>
            <Text className="text-slate-400 text-sm mt-1">
              Get notified when your target is hit
            </Text>
          </View>

          {/* Active asset preview */}
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

          {/* Create Alert Card */}
          <View
            className="bg-slate-900 rounded-3xl p-5 border border-slate-800"
            style={{ zIndex: 10 }}
          >
            {/* Symbol Dropdown */}
            <View className="mb-5" style={{ zIndex: 50 }}>
              <Text className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-2">
                Asset to monitor
              </Text>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setIsDropdownOpen(!isDropdownOpen)}
                className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-4 flex-row justify-between items-center"
              >
                <View className="flex-row items-center">
                  <View
                    className="w-2 h-2 rounded-full mr-2"
                    style={{ backgroundColor: activeColor }}
                  />
                  <Text className="text-white text-base font-semibold">
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
                  {availableSymbols.map((item, index) => {
                    const itemLabel = item.replace("BINANCE:", "");
                    const itemColor = SYMBOL_COLORS[item] || "#3b82f6";
                    const isActive = symbol === item;
                    return (
                      <TouchableOpacity
                        key={item}
                        className={`px-4 py-3.5 flex-row items-center ${
                          index !== availableSymbols.length - 1
                            ? "border-b border-slate-700"
                            : ""
                        } ${isActive ? "bg-slate-700" : ""}`}
                        onPress={() => handleSelectSymbol(item)}
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

            {/* Price Input */}
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

          <View className="mt-4 mb-6 px-1">
            <Text className="text-slate-600 text-xs leading-relaxed">
              🔔 Push notifications will be sent when the price target is
              reached.
            </Text>
          </View>

          {/* Alert History */}
          <View className="bg-slate-900 rounded-3xl p-5 border border-slate-800">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-white font-bold text-base">
                Active Alerts
              </Text>
              {isFetchingAlerts ? (
                <ActivityIndicator size="small" color="#3b82f6" />
              ) : (
                <View className="bg-blue-500 px-2.5 py-0.5 rounded-full">
                  <Text className="text-white text-xs font-bold">
                    {alerts.length}
                  </Text>
                </View>
              )}
            </View>

            {alerts.length === 0 && !isFetchingAlerts ? (
              <View className="items-center py-6">
                <Text className="text-slate-600 text-sm">
                  No active alerts yet.
                </Text>
                <Text className="text-slate-700 text-xs mt-1">
                  Set one above to get started.
                </Text>
              </View>
            ) : (
              alerts.map((alert) => (
                <AlertHistoryItem key={alert._id} item={alert} />
              ))
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
