import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import type { User } from "../types";

const SECURE_TOKEN_KEY = "havesmashed-auth-token";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  setNickname: (nickname: string, newToken: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setAuth: (user, token) => {
        SecureStore.setItemAsync(SECURE_TOKEN_KEY, token).catch(() => {});
        set({ user, token, isAuthenticated: true });
      },
      setNickname: (nickname, newToken) => {
        SecureStore.setItemAsync(SECURE_TOKEN_KEY, newToken).catch(() => {});
        set((state) => ({
          user: state.user ? { ...state.user, nickname } : null,
          token: newToken,
        }));
      },
      logout: () => {
        SecureStore.deleteItemAsync(SECURE_TOKEN_KEY).catch(() => {});
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: "havesmashed-auth",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
