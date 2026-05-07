import { STORAGE_KEYS } from "./constants";

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEYS.TOKEN);
}

export function setAuthToken(token: string): void {
  localStorage.setItem(STORAGE_KEYS.TOKEN, token);
}

export function clearAuthToken(): void {
  localStorage.removeItem(STORAGE_KEYS.TOKEN);
}
