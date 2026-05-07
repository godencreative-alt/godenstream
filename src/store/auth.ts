"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthUser } from "@/types";
import { getAuthToken, setAuthToken, clearAuthToken } from "@/lib/auth";

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  initialized: boolean;
  login(email: string, password: string): Promise<void>;
  register(
    name: string,
    email: string,
    password: string,
  ): Promise<{ message: string }>;
  logout(): void;
  init(): Promise<void>;
  refresh(): Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      loading: false,
      initialized: false,

      async login(email: string, password: string) {
        set({ loading: true });
        try {
          const res = await fetch("/api/proxy/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          });
          if (!res.ok) throw new Error("Login failed");
          const data = (await res.json()) as {
            token: string;
            user: AuthUser;
          };
          setAuthToken(data.token);
          set({ user: data.user, token: data.token, loading: false });
        } catch (err) {
          set({ loading: false });
          throw err;
        }
      },

      async register(name: string, email: string, password: string) {
        set({ loading: true });
        try {
          const res = await fetch("/api/proxy/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password }),
          });
          if (!res.ok) throw new Error("Registration failed");
          const data = (await res.json()) as { message: string };
          set({ loading: false });
          return data;
        } catch (err) {
          set({ loading: false });
          throw err;
        }
      },

      logout() {
        clearAuthToken();
        set({ user: null, token: null });
      },

      async init() {
        const token = getAuthToken();
        if (!token) {
          set({ initialized: true });
          return;
        }
        try {
          const res = await fetch("/api/proxy/api/auth/me", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = (await res.json()) as { user: AuthUser };
            set({ user: data.user, token, initialized: true });
          } else {
            clearAuthToken();
            set({ user: null, token: null, initialized: true });
          }
        } catch {
          set({ initialized: true });
        }
      },

      async refresh() {
        const token = get().token || getAuthToken();
        if (!token) return;
        try {
          const res = await fetch("/api/proxy/api/auth/me", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = (await res.json()) as { user: AuthUser };
            set({ user: data.user });
          }
        } catch {
          // silent fail
        }
      },
    }),
    {
      name: "godenstream-auth",
      partialize: (state) => ({ token: state.token, user: state.user }),
    },
  ),
);
