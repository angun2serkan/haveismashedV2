import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import type { User } from "../types";

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
        SecureStore.setItemAsync("auth_token", token);
        set({ user, token, isAuthenticated: true });
      },
      setNickname: (nickname, newToken) => {
        SecureStore.setItemAsync("auth_token", newToken);
        set((state) => ({
          user: state.user ? { ...state.user, nickname } : null,
          token: newToken,
        }));
      },
      logout: () => {
        SecureStore.deleteItemAsync("auth_token");
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
