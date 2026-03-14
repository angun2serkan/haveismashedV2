import { useAuthStore } from "@/stores/authStore";
import type {
  ApiResponse,
  City,
  Connection,
  DateEntry,
  InviteResponse,
  Stats,
} from "@/types";

const API_BASE = "/api";

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapDate(d: any): DateEntry {
  return {
    id: d.id,
    countryCode: d.country_code,
    cityId: d.city_id,
    cityName: d.city_name ?? "",
    gender: d.gender,
    ageRange: d.age_range,
    description: d.description ?? null,
    rating: d.rating,
    dateAt: d.date_at,
    tagIds: d.tag_ids ?? [],
    createdAt: d.created_at,
    updatedAt: d.updated_at,
  };
}

function mapStats(s: any): Stats {
  return {
    totalDates: s.total_dates,
    uniqueCountries: s.unique_countries,
    uniqueCities: s.unique_cities,
    averageRating: s.average_rating ?? null,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

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

  if (!json.success) {
    throw new Error(json.error ?? "Unknown error");
  }

  return json.data;
}

export const api = {
  // Auth
  register: (inviteId?: string) =>
    request<{ user_id: string; secret_phrase: string; token: string; expires_in: number }>(
      "/auth/register",
      {
        method: "POST",
        body: JSON.stringify(inviteId ? { invite_id: inviteId } : {}),
      },
    ),

  login: (secretPhrase: string) =>
    request<{ token: string; expires_in: number; user_id: string; nickname: string | null }>(
      "/auth/login",
      {
        method: "POST",
        body: JSON.stringify({ secret_phrase: secretPhrase }),
      },
    ),

  setNickname: (nickname: string) =>
    request<{ nickname: string; token: string; expires_in: number }>(
      "/auth/nickname",
      {
        method: "PUT",
        body: JSON.stringify({ nickname }),
      },
    ),

  deleteAccount: () =>
    request<{ message: string; deletion_date: string }>("/auth/delete-account", {
      method: "POST",
    }),

  // Dates
  createDate: async (data: {
    country_code: string;
    city_id: number;
    gender: "male" | "female" | "other";
    age_range: string;
    description?: string;
    rating: number;
    date_at: string;
    tag_ids: number[];
  }): Promise<DateEntry> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = await request<any>("/dates", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return mapDate(raw);
  },

  getDates: async (cursor?: string, limit?: number): Promise<{ dates: DateEntry[]; next_cursor?: string }> => {
    const params = new URLSearchParams();
    if (cursor) params.set("cursor", cursor);
    if (limit) params.set("limit", String(limit));
    const qs = params.toString();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = await request<any>(
      `/dates${qs ? `?${qs}` : ""}`,
    );
    return {
      dates: (raw.dates ?? []).map(mapDate),
      next_cursor: raw.next_cursor,
    };
  },

  getDate: async (id: string): Promise<DateEntry> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = await request<any>(`/dates/${id}`);
    return mapDate(raw);
  },

  updateDate: (id: string, data: Partial<{
    country_code: string;
    city_id: number;
    gender: "male" | "female" | "other";
    age_range: string;
    description: string;
    rating: number;
    date_at: string;
    tag_ids: number[];
  }>) =>
    request<{ id: string; message: string }>(`/dates/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteDate: (id: string) =>
    request<{ id: string; message: string }>(`/dates/${id}`, {
      method: "DELETE",
    }),

  // Cities
  getCities: (countryCode?: string) =>
    request<City[]>(
      `/cities${countryCode ? `?country_code=${countryCode}` : ""}`,
    ),

  // Stats
  getStats: async (): Promise<Stats> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = await request<any>("/stats");
    return mapStats(raw);
  },

  // Connections
  getConnections: (status?: string) =>
    request<Connection[]>(
      `/connections${status ? `?status=${status}` : ""}`,
    ),

  respondToConnection: (action: "accept" | "reject") =>
    request<{ status: string }>("/connections/respond", {
      method: "POST",
      body: JSON.stringify({ action }),
    }),

  // Invites
  createInvite: (inviteType: "platform" | "friend") =>
    request<InviteResponse>("/invites/create", {
      method: "POST",
      body: JSON.stringify({ invite_type: inviteType }),
    }),

  // Tags
  getTags: (category?: string) =>
    request<Array<{ id: number; name: string; category: string; is_predefined: boolean }>>(
      `/tags${category ? `?category=${category}` : ""}`,
    ),

  // Feed
  getFeed: () =>
    request<{ message: string; friends_active_this_week: number }>("/feed"),
};
