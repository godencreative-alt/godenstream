import { STORAGE_KEYS } from "./constants";

const MAX_ENTRIES = 30;

export interface LocalHistoryEntry {
  content_id: string;
  content_name: string;
  cover_url: string | null;
  episode_number: number;
  progress_seconds: number;
  duration_seconds: number;
  completed: boolean;
  updated_at: number;
}

export function getLocalHistory(): LocalHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.HISTORY) || "[]");
  } catch {
    return [];
  }
}

export function saveLocalProgress(
  entry: Omit<LocalHistoryEntry, "updated_at">,
): void {
  const history = getLocalHistory();
  const idx = history.findIndex(
    (h) =>
      h.content_id === entry.content_id &&
      h.episode_number === entry.episode_number,
  );
  const newEntry = { ...entry, updated_at: Date.now() };

  if (idx >= 0) {
    history[idx] = newEntry;
  } else {
    history.unshift(newEntry);
    if (history.length > MAX_ENTRIES) history.pop();
  }

  localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
}

interface BookmarkItem {
  id: string;
  [key: string]: unknown;
}

export function getLocalBookmarks(): BookmarkItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.BOOKMARKS) || "[]");
  } catch {
    return [];
  }
}

export function isLocalBookmarked(id: string): boolean {
  return getLocalBookmarks().some((b) => b.id === id);
}

export function toggleLocalBookmark(item: BookmarkItem): boolean {
  const bookmarks = getLocalBookmarks();
  const idx = bookmarks.findIndex((b) => b.id === item.id);
  if (idx >= 0) {
    bookmarks.splice(idx, 1);
    localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(bookmarks));
    return false;
  } else {
    bookmarks.unshift(item);
    localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(bookmarks));
    return true;
  }
}
