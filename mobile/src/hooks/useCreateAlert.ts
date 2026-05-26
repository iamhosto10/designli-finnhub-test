import { useState, useEffect, useCallback } from "react";
import { Alert } from "react-native";
import {
  createAlertRequest,
  getAlertsRequest,
  AlertItem,
} from "../services/alertsService";

const AVAILABLE_SYMBOLS = [
  "BINANCE:BTCUSDT",
  "BINANCE:ETHUSDT",
  "BINANCE:SOLUSDT",
  "BINANCE:BNBUSDT",
];

export const SYMBOL_COLORS: Record<string, string> = {
  "BINANCE:BTCUSDT": "#F7931A",
  "BINANCE:ETHUSDT": "#627EEA",
  "BINANCE:SOLUSDT": "#9945FF",
  "BINANCE:BNBUSDT": "#F3BA2F",
};

/**
 * Encapsulates all alert screen logic:
 * - Fetches the user's existing alerts on mount
 * - Handles symbol selection, price input, and alert creation
 * - Refreshes the list automatically after a new alert is created
 */
export const useCreateAlert = () => {
  const [symbol, setSymbol] = useState(AVAILABLE_SYMBOLS[0]);
  const [targetPrice, setTargetPrice] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [isFetchingAlerts, setIsFetchingAlerts] = useState(false);

  const fetchAlerts = useCallback(async () => {
    setIsFetchingAlerts(true);
    try {
      const data = await getAlertsRequest();
      setAlerts(data);
    } catch (error: any) {
      // Silently fail — list simply stays empty
      console.warn("Could not fetch alerts:", error.message);
    } finally {
      setIsFetchingAlerts(false);
    }
  }, []);

  // Load alerts when the screen mounts
  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const handleCreateAlert = async () => {
    const price = Number(targetPrice);

    if (!targetPrice.trim() || isNaN(price) || price <= 0) {
      Alert.alert(
        "Invalid price",
        "Please enter a valid positive target price.",
      );
      return;
    }

    setIsLoading(true);

    try {
      await createAlertRequest({ symbol, targetPrice: price });

      Alert.alert(
        "Alert Created!",
        `You'll be notified when ${symbol.replace("BINANCE:", "")} reaches $${targetPrice}`,
      );
      setTargetPrice("");

      // Refresh the list to show the newly created alert
      await fetchAlerts();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Could not connect to the server.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSymbol = (selected: string) => {
    setSymbol(selected);
    setIsDropdownOpen(false);
  };

  return {
    symbol,
    targetPrice,
    setTargetPrice,
    isLoading,
    isDropdownOpen,
    setIsDropdownOpen,
    handleCreateAlert,
    handleSelectSymbol,
    availableSymbols: AVAILABLE_SYMBOLS,
    alerts,
    isFetchingAlerts,
    fetchAlerts,
  };
};
