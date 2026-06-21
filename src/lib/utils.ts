import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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
// Keep in sync with REFERER_BY_HOST_SUFFIX in src/app/api/img/route.ts —
// any host that requires a Referer override is, by definition, blocking
// hotlinking and must be proxied.
const HOTLINK_BLOCKED_HOSTS = [
  "donghuastream.org",
  "komiku.org",
  "komiku.id",
];

/**
 * Returns a thumbnail URL safe to use in <Image>. Hosts known to block
 * hotlinking are routed through the /api/img proxy; everything else is
 * returned untouched to avoid unnecessary bandwidth through our server.
 */
export function proxyThumbnail(
  url: string | null | undefined,
): string | null {
  if (!url) return null;
  // Backend now serves thumbnails via relative /api/v1/asset/<base64>.
  // Route those through our same-origin proxy so the API key is attached
  // and the asset is reachable from the browser.
  if (url.startsWith("/api/v1/")) {
    return `/api/proxy${url}`;
  }
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
