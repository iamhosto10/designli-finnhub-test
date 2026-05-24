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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RegisterScreen({ navigation }: any) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert("Incomplete fields", "Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL;

      const response = await fetch(`${apiUrl}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password: password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          "Account Created!",
          "Your account is ready. You can now sign in.",
          [{ text: "OK", onPress: () => navigation.navigate("Login") }],
        );
      } else {
        Alert.alert(
          "Registration Error",
          data.message || "Could not create account.",
        );
      }
    } catch (error) {
      console.error(error);
      Alert.alert(
        "Connection Error",
        "There was a problem connecting to the server.",
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
              Create Account
            </Text>
            <Text className="text-slate-400 text-sm mt-1.5 tracking-wide">
              Start monitoring markets in seconds
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

            <View className="mb-4">
              <Text className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-2">
                Password
              </Text>
              <TextInput
                className="bg-slate-800 rounded-xl px-4 py-4 text-white text-base border border-slate-700"
                placeholder="Min. 6 characters"
                placeholderTextColor="#475569"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <View className="mb-6">
              <Text className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-2">
                Confirm Password
              </Text>
              <TextInput
                className="bg-slate-800 rounded-xl px-4 py-4 text-white text-base border border-slate-700"
                placeholder="Repeat your password"
                placeholderTextColor="#475569"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </View>

            <TouchableOpacity
              className={`rounded-xl py-4 items-center ${isLoading ? "bg-blue-400" : "bg-blue-500"}`}
              onPress={handleRegister}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-white text-base font-bold tracking-wide">
                  Create Account
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              className="mt-5 items-center"
              onPress={() => navigation.navigate("Login")}
            >
              <Text className="text-slate-500 text-sm">
                Already have an account?{" "}
                <Text className="text-blue-400 font-semibold">Sign in</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
