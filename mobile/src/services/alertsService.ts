import { apiClient } from "./apiClient";

export interface CreateAlertPayload {
  symbol: string;
  targetPrice: number;
}

export interface AlertItem {
  _id: string;
  symbol: string;
  targetPrice: number;
  isActive: boolean;
  createdAt: string;
}

/**
 * Fetches all active alerts belonging to the authenticated user.
 * The userId is resolved server-side from the JWT token.
 */
export const getAlertsRequest = async (): Promise<AlertItem[]> => {
  const response = await apiClient("/api/alerts");
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Could not fetch alerts.");
  }

  return data.data as AlertItem[];
};

/**
 * Creates a new price alert for the authenticated user.
 * The userId is resolved server-side from the JWT token —
 * no need to pass it from the client.
 */
export const createAlertRequest = async (
  payload: CreateAlertPayload,
): Promise<AlertItem> => {
  const response = await apiClient("/api/alerts", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Could not create alert.");
  }

  return data.data as AlertItem;
};
