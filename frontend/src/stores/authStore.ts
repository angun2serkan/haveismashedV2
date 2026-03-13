import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types";

interface AuthState {
  user: User | null;
  token: string | null;
  encryptionKey: CryptoKey | null;
  isAuthenticated: boolean;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  setEncryptionKey: (key: CryptoKey) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      encryptionKey: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: true }),
      setToken: (token) => set({ token }),
      setEncryptionKey: (key) => set({ encryptionKey: key }),
      logout: () =>
        set({
          user: null,
          token: null,
          encryptionKey: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: "havesmashed-auth",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
