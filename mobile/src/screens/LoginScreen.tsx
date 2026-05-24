import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  PermissionsAndroid,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import messaging from "@react-native-firebase/messaging";

export default function LoginScreen({ navigation }: any) {
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
      if (Platform.OS === "android" && Platform.Version >= 33) {
        await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        );
      }

      await messaging().requestPermission();

      const fcmToken = await messaging().getToken();
      console.log("FCM Token:", fcmToken);

      const apiUrl = process.env.EXPO_PUBLIC_API_URL;

      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password: password,
          fcmToken: fcmToken,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        await AsyncStorage.setItem("userToken", data.token);
        await AsyncStorage.setItem("userId", data.userId);
        navigation.replace("Main");
      } else {
        Alert.alert(
          "Authentication Error",
          data.message || "Invalid credentials",
        );
      }
    } catch (error) {
      console.error(error);
      Alert.alert(
        "Connection Error",
        "Could not connect to the server. Make sure your backend is running.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="flex-1 justify-center px-6">
          <View className="items-center mb-10">
            <Text className="text-white text-3xl font-bold tracking-tight">
              Finnhub
            </Text>
            <Text className="text-slate-400 text-sm mt-1.5 tracking-wide">
              Real-time market alerts
            </Text>
          </View>

          <View className="bg-slate-900 rounded-3xl p-6 border border-slate-800">
            <View className="mb-4">
              <Text className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-2">
                Email
              </Text>
              <TextInput
                className="bg-slate-800 rounded-xl px-4 py-4 text-white text-base border border-slate-700"
                placeholder="you@example.com"
                placeholderTextColor="#475569"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View className="mb-6">
              <Text className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-2">
                Password
              </Text>
              <TextInput
                className="bg-slate-800 rounded-xl px-4 py-4 text-white text-base border border-slate-700"
                placeholder="••••••••"
                placeholderTextColor="#475569"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <TouchableOpacity
              className={`rounded-xl py-4 items-center ${isLoading ? "bg-blue-400" : "bg-blue-500"}`}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-white text-base font-bold tracking-wide">
                  Sign In
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              className="mt-5 items-center"
              onPress={() => navigation.navigate("Register")}
            >
              <Text className="text-slate-500 text-sm">
                Don't have an account?{" "}
                <Text className="text-blue-400 font-semibold">Sign up</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
