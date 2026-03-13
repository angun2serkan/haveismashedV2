import { create } from "zustand";
import type { Connection } from "@/types";

interface FriendState {
  connections: Connection[];
  pendingRequests: Connection[];
  setConnections: (connections: Connection[]) => void;
  setPendingRequests: (requests: Connection[]) => void;
  removeConnection: (id: string) => void;
  updateConnectionStatus: (id: string, status: Connection["status"]) => void;
}

export const useFriendStore = create<FriendState>((set) => ({
  connections: [],
  pendingRequests: [],
  setConnections: (connections) => set({ connections }),
  setPendingRequests: (requests) => set({ pendingRequests: requests }),
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
}));
