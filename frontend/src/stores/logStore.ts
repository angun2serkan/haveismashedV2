import { create } from "zustand";
import type { LogEntry, Stats } from "@/types";

interface LogState {
  entries: LogEntry[];
  stats: Stats;
  selectedCountry: string | null;
  selectedCity: { id: number; name: string; lat: number; lng: number } | null;
  isLogFormOpen: boolean;
  setEntries: (entries: LogEntry[]) => void;
  addEntry: (entry: LogEntry) => void;
  removeEntry: (id: string) => void;
  updateEntry: (id: string, entry: Partial<LogEntry>) => void;
  setStats: (stats: Stats) => void;
  setSelectedCountry: (code: string | null) => void;
  setSelectedCity: (
    city: { id: number; name: string; lat: number; lng: number } | null,
  ) => void;
  openLogForm: () => void;
  closeLogForm: () => void;
}

export const useLogStore = create<LogState>((set) => ({
  entries: [],
  stats: { totalEntries: 0, uniqueCountries: 0, uniqueCities: 0 },
  selectedCountry: null,
  selectedCity: null,
  isLogFormOpen: false,
  setEntries: (entries) => set({ entries }),
  addEntry: (entry) =>
    set((state) => ({ entries: [entry, ...state.entries] })),
  removeEntry: (id) =>
    set((state) => ({
      entries: state.entries.filter((e) => e.id !== id),
    })),
  updateEntry: (id, updates) =>
    set((state) => ({
      entries: state.entries.map((e) =>
        e.id === id ? { ...e, ...updates } : e,
      ),
    })),
  setStats: (stats) => set({ stats }),
  setSelectedCountry: (code) => set({ selectedCountry: code }),
  setSelectedCity: (city) => set({ selectedCity: city }),
  openLogForm: () => set({ isLogFormOpen: true }),
  closeLogForm: () => set({ isLogFormOpen: false, selectedCity: null }),
}));
