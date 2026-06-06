"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthUser } from "@/types";
import { getAuthToken, setAuthToken, clearAuthToken } from "@/lib/auth";
import { fetchAuthMe } from "@/lib/api";

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  initialized: boolean;
  setSession(token: string): Promise<void>;
  login(): never;
  register(): never;
  logout(): void;
  init(): Promise<void>;
  refresh(): Promise<void>;
}

const OAUTH_ONLY_ERROR =
  "Password auth is disabled. Use Google sign-in via goden.store.";

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      loading: false,
      initialized: false,

      async setSession(token: string) {
        set({ loading: true });
        try {
          const user = await fetchAuthMe(token);
          setAuthToken(token);
          set({ user, token, initialized: true, loading: false });
        } catch (error) {
          clearAuthToken();
          set({ user: null, token: null, initialized: true, loading: false });
          throw error;
        }
      },

      login() {
        throw new Error(OAUTH_ONLY_ERROR);
      },

      register() {
        throw new Error(OAUTH_ONLY_ERROR);
      },

      logout() {
        clearAuthToken();
        set({ user: null, token: null });
      },

      async init() {
        const token = get().token || getAuthToken();
        if (!token) {
          set({ initialized: true });
          return;
        }

        try {
          const user = await fetchAuthMe(token);
          set({ user, token, initialized: true });
        } catch {
          clearAuthToken();
          set({ user: null, token: null, initialized: true });
        }
      },

      async refresh() {
        const token = get().token || getAuthToken();
        if (!token) return;

        try {
          const user = await fetchAuthMe(token);
          set({ user, token });
        } catch {
          clearAuthToken();
          set({ user: null, token: null });
        }
      },
    }),
    {
      name: "godenstream-auth",
      partialize: (state) => ({ token: state.token, user: state.user }),
    },
  ),
);
