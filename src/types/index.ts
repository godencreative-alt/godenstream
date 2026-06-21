// api.godenpg.dev contract — see /www/wwwroot/godenpg.dev/backend/app/api/v1/endpoints/*

// -- Envelopes -----------------------------------------------------------

export interface GodenCacheInfo {
  cached: boolean;
  ttl?: number;
}

export interface GodenListMeta {
  page?: number;
  total?: number;
  total_items?: number;
  query?: string;
  source?: string;
  category?: string;
  genre?: string;
  type?: string;
  failover?: boolean;
  is_fallback?: boolean;
  has_next_page?: boolean;
  sources?: string[];
}

export interface GodenEnvelope<T> {
  status: "success" | string;
  data: T;
  cache?: GodenCacheInfo;
}

export interface GodenListEnvelope<T> {
  status: "success" | string;
  data: T[];
  cache?: GodenCacheInfo;
  meta?: GodenListMeta;
}

// -- Content list/detail items ------------------------------------------

export interface GodenListItem {
  title: string;
  slug?: string;
  video_id?: string; // adult endpoints use video_id instead of slug
  url: string;
  thumbnail: string;
  source?: string;
  type?: string; // anime: "ongoing"; donghua: "Donghua"; etc.
  category?: string; // entertainment: "movie" | "adult"
  episode?: string; // donghua latest carries "Ep N"
  latest_chapter?: string; // comic carries chapter label
  in_vault?: boolean;
}

export interface GodenEpisode {
  title: string;
  slug: string;
  url: string;
  date?: string;
  chapter?: string;
}

export interface AnimeDetail {
  title: string;
  slug: string;
  thumbnail: string;
  synopsis?: string;
  info: Record<string, string>;
  in_vault?: boolean;
}

export interface MovieDetail {
  title: string;
  slug: string;
  url: string;
  thumbnail: string;
  description?: string | null;
  info: Record<string, string>;
  sources?: GodenSource[];
  source?: string;
  in_vault?: boolean;
}

export interface ComicDetail {
  title: string;
  slug: string;
  url: string;
  thumbnail: string;
  description?: string | null;
  info: Record<string, string>;
  genres?: string[];
  chapters?: GodenEpisode[];
  chapter_count?: number;
  source?: string;
  type?: string;
  in_vault?: boolean;
}

export interface DonghuaDetail {
  title: string;
  slug: string;
  url: string;
  thumbnail: string;
  description?: string | null;
  info: Record<string, string>;
  episodes: GodenEpisode[];
  source?: string;
  in_vault?: boolean;
}

// -- Playback sources ----------------------------------------------------

export type GodenSourceType = "embed" | "hls" | "mp4" | "download" | string;

export interface GodenSource {
  type: GodenSourceType;
  url: string;
  quality?: string;
  label?: string;
  recommended?: boolean;
  note?: string;
  requires_player?: string | null;
  host?: string;
}

export interface GodenPlayback {
  preferred?: "embed" | "hls" | string;
  note?: string;
}

export type AnimeDownloadData = Record<string, { host: string; url: string }[]>;

export interface AnimeSourcesData {
  title: string;
  episode_slug: string;
  thumbnail?: string;
  sources: GodenSource[];
  playback?: GodenPlayback;
}

// -- UI compatibility models ---------------------------------------------

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

export interface EntertainmentDetail {
  title: string;
  slug: string;
  url: string;
  thumbnail: string;
  description?: string | null;
  info: Record<string, string>;
  sources?: GodenSource[];
  source?: string;
  category?: string;
  in_vault?: boolean;
}

// -- Vault ---------------------------------------------------------------

export interface VaultStreamRef {
  artifact_id: string;
  stream_url: string;
}

export interface VaultFile extends VaultStreamRef {
  kind: "video" | "comic" | "image" | string;
  quality?: string;
}

export interface VaultReadyData {
  id: string;
  title: string;
  status: "ready" | string;
  thumbnail?: VaultStreamRef | null;
  files: VaultFile[];
}

export interface VaultScrapingData {
  status: "scraping" | string;
  content_id?: string;
}

export type VaultResolveResponse =
  | { state: "ready"; data: VaultReadyData }
  | { state: "scraping"; data: VaultScrapingData }
  | { state: string; data?: VaultReadyData | VaultScrapingData; detail?: string };

// -- Auth ----------------------------------------------------------------

export type SubscriptionPlan = "free" | "starter" | "pro" | "enterprise" | string;

export interface AuthUser {
  id: number;
  email: string;
  full_name: string;
  avatar_url: string;
  subscription_plan: SubscriptionPlan;
  is_active: boolean;
}
