export interface User {
  id: string;
  publicKey: string;
  createdAt: string;
  lastSeenAt: string | null;
  inviteCount: number;
}

export interface LogEntry {
  id: string;
  userId: string;
  countryCode: string;
  cityId: number;
  cityName: string;
  countryName: string;
  entryDate: string;
  latitude: number;
  longitude: number;
  // Decrypted client-side
  tags: string[];
  rating: number | null;
  notes: string;
  createdAt: string;
  updatedAt: string | null;
}

export interface LogEntryEncrypted {
  id: string;
  userId: string;
  countryCode: string;
  cityId: number;
  entryDate: string;
  encryptedData: string; // base64
  encryptionIv: string; // base64
  createdAt: string;
  updatedAt: string | null;
}

export interface Connection {
  id: string;
  requesterId: string;
  responderId: string;
  status: "pending" | "accepted" | "rejected" | "blocked";
  createdAt: string;
  updatedAt: string | null;
}

export interface Stats {
  totalEntries: number;
  uniqueCountries: number;
  uniqueCities: number;
}

export interface City {
  id: number;
  name: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  population: number | null;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

export interface CountryFeature {
  type: "Feature";
  properties: {
    ISO_A2: string;
    ADMIN: string;
    logCount?: number;
  };
  geometry: GeoJSON.Geometry;
}

export const PREDEFINED_TAGS = [
  "App",
  "Bar/Club",
  "Through Friends",
  "Holiday",
  "Business Trip",
  "School",
  "Work",
  "Online",
  "Event",
  "Other",
] as const;
