import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLogin } from "../hooks/useLogin";

export default function LoginScreen({ navigation }: any) {
  const { email, setEmail, password, setPassword, isLoading, handleLogin } =
    useLogin(navigation);

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
