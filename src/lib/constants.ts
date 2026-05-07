export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const SECTION_ACCENTS = {
  drama: {
    color: "#f5c518",
    class: "text-dc-gold",
    bg: "bg-dc-gold",
    dim: "bg-dc-gold/15",
  },
  anime: {
    color: "#a78bfa",
    class: "text-dc-violet",
    bg: "bg-dc-violet",
    dim: "bg-dc-violet/15",
  },
  moviebox: {
    color: "#fb923c",
    class: "text-dc-orange",
    bg: "bg-dc-orange",
    dim: "bg-dc-orange/15",
  },
  iqiyi: {
    color: "#22d3ee",
    class: "text-dc-cyan",
    bg: "bg-dc-cyan",
    dim: "bg-dc-cyan/15",
  },
  wetv: {
    color: "#f43f5e",
    class: "text-dc-rose",
    bg: "bg-dc-rose",
    dim: "bg-dc-rose/15",
  },
} as const;

export type SectionKey = keyof typeof SECTION_ACCENTS;

export const PLAN_RANK: Record<string, number> = {
  free: 0,
  starter: 1,
  plus: 2,
  premium: 3,
  ultimate: 4,
  enterprise: 5,
};

export function hasPlanAccess(
  userPlan: string | undefined | null,
  requiredPlan: string,
): boolean {
  const userRank = PLAN_RANK[userPlan ?? "free"] ?? 0;
  const requiredRank = PLAN_RANK[requiredPlan] ?? 0;
  return userRank >= requiredRank;
}

export const STORAGE_KEYS = {
  TOKEN: "godenstream_token",
  DEVICE_ID: "godenstream_device_id",
  HISTORY: "godenstream_history",
  BOOKMARKS: "godenstream_bookmarks",
  VOLUME: "godenstream_volume",
  LANGUAGE: "godenstream_language",
} as const;

export const SECTION_MIN_PLAN: Record<SectionKey, string> = {
  drama: "free",
  anime: "free",
  moviebox: "free",
  iqiyi: "free",
  wetv: "free",
};
