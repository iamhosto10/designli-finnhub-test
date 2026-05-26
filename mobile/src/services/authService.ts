import { apiClient } from "./apiClient";

export interface LoginPayload {
  email: string;
  password: string;
  fcmToken: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  userId: string;
  email: string;
}

/**
 * Sends login credentials and FCM token to the backend.
 * Returns the JWT token and user data on success.
 */
export const loginRequest = async (
  payload: LoginPayload,
): Promise<AuthResponse> => {
  const response = await apiClient("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Authentication failed.");
  }

  return data.data as AuthResponse;
};

/**
 * Registers a new user account.
 * Does not return user data — redirects to login after success.
 */
export const registerRequest = async (
  payload: RegisterPayload,
): Promise<void> => {
  const response = await apiClient("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Registration failed.");
  }
};
