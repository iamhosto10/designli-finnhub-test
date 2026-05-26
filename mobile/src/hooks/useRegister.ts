import { useState } from "react";
import { Alert } from "react-native";
import { registerRequest } from "../services/authService";

/**
 * Encapsulates all registration logic — validation, API call,
 * and navigation on success.
 * The screen only calls handleRegister() and reads isLoading.
 */
export const useRegister = (navigation: any) => {
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
      await registerRequest({
        email: email.trim().toLowerCase(),
        password,
      });

      Alert.alert(
        "Account Created!",
        "Your account is ready. You can now sign in.",
        [{ text: "OK", onPress: () => navigation.navigate("Login") }],
      );
    } catch (error: any) {
      Alert.alert("Error", error.message || "Could not connect to the server.");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    isLoading,
    handleRegister,
  };
};
