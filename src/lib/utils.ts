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
 * Decode a base64url / standard base64 string to UTF-8 text.
 * Returns null on failure.
 */
function decodeBase64(b64: string): string | null {
  try {
    let s = b64.replace(/-/g, "+").replace(/_/g, "/");
    s += "=".repeat((-s.length % 4 + 4) % 4);
    return atob(s);
  } catch {
    return null;
  }
}

/**
 * Returns a thumbnail URL safe to use in <Image>.
 *
 * Backend asset-proxy URLs (`/v1/asset/<base64>`) are decoded to the
 * original upstream URL so images are fetched directly — the backend proxy
 * pool is unreliable and frequently returns 502.
 *
 * Hosts known to block hotlinking are routed through the /api/img proxy;
 * everything else is returned untouched so Next.js can optimise the image.
 */
export function proxyThumbnail(
  url: string | null | undefined,
): string | null {
  if (!url) return null;

  // Backend asset-proxy: decode the embedded base64 to the original URL.
  if (url.startsWith("/v1/asset/")) {
    const b64 = url.slice("/v1/asset/".length);
    const decoded = decodeBase64(b64);
    if (decoded && decoded.startsWith("http")) {
      // Use the original URL directly; fall through to hotlink check.
      url = decoded;
    } else {
      // Could not decode — fall back to proxy route.
      return `/api/proxy${url}`;
    }
  }

  // Legacy /v1/ paths (non-asset) still go through the proxy.
  if (url.startsWith("/v1/")) {
    return `/api/proxy${url}`;
  }

  // Check if the (possibly decoded) host blocks hotlinking.
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
