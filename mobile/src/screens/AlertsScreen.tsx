import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
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

export default function AlertsScreen() {
  const [symbol, setSymbol] = useState(AVAILABLE_SYMBOLS[0]);
  const [targetPrice, setTargetPrice] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserId = async () => {
      const storedId = await AsyncStorage.getItem("userId");
      if (storedId) {
        setUserId(storedId);
      }
    };
    fetchUserId();
  }, []);

  const handleCreateAlert = async () => {
    if (!targetPrice.trim() || isNaN(Number(targetPrice))) {
      Alert.alert(
        "Precio inválido",
        "Por favor ingresa un precio objetivo numérico válido.",
      );
      return;
    }

    setIsLoading(true);

    try {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL;

      const response = await fetch(`${apiUrl}/api/alerts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: userId,
          symbol: symbol,
          targetPrice: Number(targetPrice),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          "¡Éxito!",
          `Alerta creada para ${symbol.replace("BINANCE:", "")} a $${targetPrice}`,
        );
        setTargetPrice("");
      } else {
        Alert.alert("Error", data.message || "No se pudo crear la alerta");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error de conexión", "No pudimos conectar con el servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Mis Alertas</Text>
          <Text style={styles.subtitle}>
            Te notificaremos cuando se alcance el precio.
          </Text>

          <View style={styles.card}>
            {/* Selector de Símbolo (Custom Dropdown) */}
            <View style={{ marginBottom: 20, zIndex: 50 }}>
              <Text style={styles.label}>Activo a monitorear</Text>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setIsDropdownOpen(!isDropdownOpen)}
                style={styles.dropdownSelector}
              >
                <Text style={styles.dropdownText}>
                  {symbol.replace("BINANCE:", "")}
                </Text>
                <Text style={styles.dropdownArrow}>
                  {isDropdownOpen ? "▲" : "▼"}
                </Text>
              </TouchableOpacity>

              {/* Lista desplegable */}
              {isDropdownOpen && (
                <View style={styles.dropdownMenu}>
                  {AVAILABLE_SYMBOLS.map((item, index) => (
                    <TouchableOpacity
                      key={item}
                      style={[
                        styles.dropdownItem,
                        index !== AVAILABLE_SYMBOLS.length - 1 &&
                          styles.dropdownItemBorder,
                        symbol === item && styles.dropdownItemActive,
                      ]}
                      onPress={() => {
                        setSymbol(item);
                        setIsDropdownOpen(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.dropdownItemText,
                          symbol === item && styles.dropdownItemTextActive,
                        ]}
                      >
                        {item.replace("BINANCE:", "")}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Input de Precio */}
            <View style={{ marginBottom: 24 }}>
              <Text style={styles.label}>Precio Objetivo ($)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej. 65000.50"
                placeholderTextColor="#a1a1aa"
                value={targetPrice}
                onChangeText={setTargetPrice}
                keyboardType="numeric"
                onFocus={() => setIsDropdownOpen(false)}
              />
            </View>

            {/* Botón de Submit */}
            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleCreateAlert}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.buttonText}>Crear Alerta</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f4f5", // Mismo fondo que StocksScreen
  },
  scrollContainer: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#18181b",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#71717a",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    zIndex: 1, // Necesario para que el dropdown flote por encima del resto
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#52525b",
    marginBottom: 8,
  },
  dropdownSelector: {
    backgroundColor: "#f4f4f5",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dropdownText: {
    fontSize: 16,
    color: "#18181b",
    fontWeight: "500",
  },
  dropdownArrow: {
    color: "#a1a1aa",
    fontSize: 12,
  },
  dropdownMenu: {
    position: "absolute",
    top: 80,
    left: 0,
    right: 0,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 100,
  },
  dropdownItem: {
    padding: 16,
  },
  dropdownItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#f4f4f5",
  },
  dropdownItemActive: {
    backgroundColor: "#eff6ff",
  },
  dropdownItemText: {
    fontSize: 16,
    color: "#3f3f46",
  },
  dropdownItemTextActive: {
    color: "#2563eb",
    fontWeight: "bold",
  },
  input: {
    backgroundColor: "#f4f4f5",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#18181b",
  },
  button: {
    backgroundColor: "#3b82f6",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#3b82f6",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  buttonDisabled: {
    backgroundColor: "#93c5fd",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
