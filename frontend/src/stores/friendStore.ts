import { create } from "zustand";
import type { Connection, FriendDate } from "@/types";

interface FriendState {
  connections: Connection[];
  pendingRequests: Connection[];
  friendDates: FriendDate[];
  setConnections: (connections: Connection[]) => void;
  setPendingRequests: (requests: Connection[]) => void;
  setFriendDates: (dates: FriendDate[]) => void;
  removeConnection: (id: string) => void;
  updateConnectionStatus: (id: string, status: Connection["status"]) => void;
  updateConnectionColor: (id: string, color: string) => void;
}

export const useFriendStore = create<FriendState>((set) => ({
  connections: [],
  pendingRequests: [],
  friendDates: [],
  setConnections: (connections) => set({ connections }),
  setPendingRequests: (requests) => set({ pendingRequests: requests }),
  setFriendDates: (dates) => set({ friendDates: dates }),
  removeConnection: (id) =>
    set((state) => ({
      connections: state.connections.filter((c) => c.id !== id),
    })),
  updateConnectionStatus: (id, status) =>
    set((state) => ({
      connections: state.connections.map((c) =>
        c.id === id ? { ...c, status } : c,
      ),
      pendingRequests: state.pendingRequests.filter((c) => c.id !== id),
    })),
  updateConnectionColor: (id, color) =>
    set((state) => ({
      connections: state.connections.map((c) =>
        c.id === id ? { ...c, color } : c,
      ),
    })),
}));
