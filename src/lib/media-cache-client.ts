import type { PublicSettings } from "@/lib/admin/types";

const MEDIA_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".mp4", ".m3u8", ".ts"];

export function shouldCacheMediaUrl(url: string | null | undefined) {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && MEDIA_EXTENSIONS.some((ext) => parsed.pathname.toLowerCase().includes(ext));
  } catch {
    return false;
  }
}

export function cachedMediaUrl(url: string | null | undefined, settings?: PublicSettings | null) {
  if (!url || !settings?.cache.enabled) return url || "";
  return shouldCacheMediaUrl(url)
    ? `/api/cache/media?url=${encodeURIComponent(url)}`
    : url;
}
