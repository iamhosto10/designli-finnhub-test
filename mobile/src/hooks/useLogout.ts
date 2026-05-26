import { Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { useMarketStore } from "../store/useMarketStore";

/**
 * Encapsulates the logout flow — confirmation dialog,
 * WebSocket disconnection, session cleanup, and navigation reset.
 */
export const useLogout = () => {
  const navigation = useNavigation<any>();
  const disconnect = useMarketStore((state) => state.disconnect);

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          disconnect();
          await AsyncStorage.removeItem("userToken");
          await AsyncStorage.removeItem("userId");
          navigation.reset({ index: 0, routes: [{ name: "Login" }] });
        },
      },
    ]);
  };

  return { handleLogout };
};
