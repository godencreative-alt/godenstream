import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPlayCount(count: number): string {
  if (count >= 1_000_000_000) return `${(count / 1_000_000_000).toFixed(1)}B`;
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return String(count);
}

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export function truncateText(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen).trimEnd() + "...";
}

const BADGE_PALETTE = [
  "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  "bg-rose-500/20 text-rose-300 border-rose-500/30",
  "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  "bg-violet-500/20 text-violet-300 border-violet-500/30",
  "bg-orange-500/20 text-orange-300 border-orange-500/30",
  "bg-pink-500/20 text-pink-300 border-pink-500/30",
  "bg-teal-500/20 text-teal-300 border-teal-500/30",
  "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
  "bg-lime-500/20 text-lime-300 border-lime-500/30",
  "bg-amber-500/20 text-amber-300 border-amber-500/30",
  "bg-sky-500/20 text-sky-300 border-sky-500/30",
  "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30",
  "bg-red-500/20 text-red-300 border-red-500/30",
  "bg-blue-500/20 text-blue-300 border-blue-500/30",
  "bg-green-500/20 text-green-300 border-green-500/30",
];

export function providerBadgeColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return BADGE_PALETTE[Math.abs(hash) % BADGE_PALETTE.length];
}

// Hosts that block hotlinking and must be served via /api/img.
// Keep in sync with the whitelist in src/app/api/img/route.ts.
const HOTLINK_BLOCKED_HOSTS = ["donghuastream.org"];

/**
 * Returns a thumbnail URL safe to use in <Image>. Hosts known to block
 * hotlinking are routed through the /api/img proxy; everything else is
 * returned untouched to avoid unnecessary bandwidth through our server.
 */
export function proxyThumbnail(
  url: string | null | undefined,
): string | null {
  if (!url) return null;
  try {
    const host = new URL(url).hostname.toLowerCase();
    const blocked = HOTLINK_BLOCKED_HOSTS.some(
      (h) => host === h || host.endsWith(`.${h}`),
    );
    if (blocked) return `/api/img?url=${encodeURIComponent(url)}`;
  } catch {
    return url;
  }
  return url;
}
