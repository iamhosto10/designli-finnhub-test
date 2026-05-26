import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

/**
 * Base API client that automatically attaches the Authorization header
 * from AsyncStorage on every request. All services use this instead
 * of calling fetch() directly.
 */
export const apiClient = async (
  endpoint: string,
  options: RequestInit = {},
): Promise<Response> => {
  const token = await AsyncStorage.getItem("userToken");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });
};
