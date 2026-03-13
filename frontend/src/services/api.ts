import { useAuthStore } from "@/stores/authStore";
import type { ApiResponse } from "@/types";

const API_BASE = "/api";

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = useAuthStore.getState().token;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    useAuthStore.getState().logout();
    throw new Error("Session expired");
  }

  const json: ApiResponse<T> = await response.json();

  if (!json.success || json.data === null) {
    throw new Error(json.error ?? "Unknown error");
  }

  return json.data;
}

export const api = {
  // Auth
  register: (publicKey: string) =>
    request<{ userId: string; challenge: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ publicKey }),
    }),

  getChallenge: (publicKey: string) =>
    request<{ challenge: string; expiresAt: string }>("/auth/challenge", {
      method: "POST",
      body: JSON.stringify({ publicKey }),
    }),

  verify: (data: {
    publicKey: string;
    challenge: string;
    timestamp: string;
    signature: string;
  }) =>
    request<{ token: string; expiresIn: number }>("/auth/verify", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Logs
  createLog: (data: {
    countryCode: string;
    cityId: number;
    entryDate: string;
    latitude: number;
    longitude: number;
    encryptedData: string;
    encryptionIv: string;
  }) =>
    request("/logs", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getLogs: (cursor?: string) =>
    request<{ items: unknown[]; nextCursor: string | null }>(
      `/logs${cursor ? `?cursor=${cursor}` : ""}`,
    ),

  deleteLog: (id: string) =>
    request(`/logs/${id}`, { method: "DELETE" }),

  updateLog: (id: string, data: object) =>
    request(`/logs/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // Stats
  getStats: () =>
    request<{ totalEntries: number; uniqueCountries: number; uniqueCities: number }>(
      "/stats",
    ),

  // Connections
  getConnections: (status?: string) =>
    request(`/connections${status ? `?status=${status}` : ""}`),

  acceptConnection: (id: string) =>
    request(`/connections/${id}/accept`, { method: "POST" }),

  rejectConnection: (id: string) =>
    request(`/connections/${id}/reject`, { method: "POST" }),

  deleteConnection: (id: string) =>
    request(`/connections/${id}`, { method: "DELETE" }),

  // Invites
  createInvite: () =>
    request<{ inviteUrl: string }>("/invites", { method: "POST" }),

  validateInvite: (uuid: string) =>
    request<{ valid: boolean }>(`/invites/${uuid}`),

  // Feed
  getFeed: () => request("/feed"),
};
