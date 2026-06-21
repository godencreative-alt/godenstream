export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const STORAGE_KEYS = {
  TOKEN: "godenstream_token",
  HISTORY: "godenstream_history",
  BOOKMARKS: "godenstream_bookmarks",
  VOLUME: "godenstream_volume",
  LANGUAGE: "godenstream_language",
} as const;
