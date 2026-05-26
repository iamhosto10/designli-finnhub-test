import { useState } from "react";
import { Alert, Platform, PermissionsAndroid } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import messaging from "@react-native-firebase/messaging";
import { loginRequest } from "../services/authService";

/**
 * Encapsulates all login logic — FCM token retrieval, API call,
 * session storage, and error handling.
 * The screen only calls handleLogin() and reads isLoading.
 */
export const useLogin = (navigation: any) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Incomplete fields", "Please enter your email and password.");
      return;
    }

    setIsLoading(true);

    try {
      // Request notification permissions (Android 13+)
      if (Platform.OS === "android" && Platform.Version >= 33) {
        await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        );
      }

      await messaging().requestPermission();
      const fcmToken = await messaging().getToken();

      const data = await loginRequest({
        email: email.trim().toLowerCase(),
        password,
        fcmToken,
      });

      // Persist session tokens locally
      await AsyncStorage.setItem("userToken", data.token);
      await AsyncStorage.setItem("userId", data.userId);

      navigation.replace("Main");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Could not connect to the server.");
    } finally {
      setIsLoading(false);
    }
  };

  return { email, setEmail, password, setPassword, isLoading, handleLogin };
};
