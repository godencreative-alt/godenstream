// goden.store API contract — see /www/wwwroot/goden.store/app/api/v1/endpoints/*

// -- Envelopes -----------------------------------------------------------

export interface GodenCacheInfo {
  cached: boolean;
  ttl?: number;
}

export interface GodenListMeta {
  page?: number;
  total_items?: number;
  query?: string;
  source?: string;
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
  type?: string; // anime: "ongoing"
}

export interface GodenEpisode {
  title: string;
  slug: string;
  url: string;
  date?: string;
}

export interface DracinDetail {
  title: string;
  slug: string;
  url: string;
  thumbnail: string;
  description?: string | null;
  info: Record<string, string>;
  episodes: GodenEpisode[];
  source?: string;
}

export interface AnimeDetail {
  title: string;
  slug: string;
  thumbnail: string;
  synopsis?: string;
  info: Record<string, string>;
}

export interface MovieDetail {
  title: string;
  slug: string;
  url: string;
  thumbnail: string;
  description?: string | null;
  info: Record<string, string>;
  sources: GodenSource[];
  source?: string;
}

export interface AdultDetail {
  title: string;
  video_id: string;
  thumbnail: string;
  video_sources?: unknown[];
  sources?: GodenSource[] | null;
  playback?: GodenPlayback | null;
}

// -- Playback sources ----------------------------------------------------

export type GodenSourceType = "embed" | "hls" | "mp4" | "download" | string;

export interface GodenSource {
  type: GodenSourceType;
  url: string;
  quality?: string;
  recommended?: boolean;
  note?: string;
  requires_player?: string | null;
  host?: string;
}

export interface GodenPlayback {
  preferred?: "embed" | "hls" | string;
  note?: string;
}

export interface DracinSourcesData {
  title: string;
  slug: string;
  sources: GodenSource[];
  source?: string;
}

export interface AnimeSourcesData {
  title: string;
  episode_slug: string;
  thumbnail?: string;
  sources: GodenSource[];
  playback?: GodenPlayback;
}

export type AnimeDownloadData = Record<string, { host: string; url: string }[]>;

// -- UI compatibility models ---------------------------------------------

export interface Drama {
  id: string;
  title: string;
  cover_url: string | null;
  provider_id: number;
  provider_name: string;
  provider_slug: string;
  chapter_count: number | null;
  play_count: number;
  introduction: string | null;
  language: string | null;
  is_dubbed: boolean;
  slug?: string;
  source_url?: string;
  raw_data?: Record<string, unknown> | null;
}

export interface Episode {
  id: string;
  drama_id: string;
  episode_index: number;
  episode_name: string | null;
  video_url: string | null;
  subtitle_url: string | null;
  subtitles: { lang: string; url: string }[] | null;
  qualities: Record<string, string> | null;
  status: string;
  duration_seconds?: number | null;
  slug?: string;
  sources?: GodenSource[];
}

export interface DramaDetailCompat extends Drama {
  episodes?: Episode[];
  episode_count?: number;
  info?: Record<string, string>;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

export interface AnimeItem {
  id: string;
  name: string;
  cover_url?: string | null;
  description?: string | null;
  genres: string[];
  anilist_id?: number | null;
  available_episodes: number;
  stats?: { sub?: number | null; dub?: number | null } | null;
  updated_at?: string | null;
  anilist_data?: {
    title?: {
      romaji?: string | null;
      english?: string | null;
      native?: string | null;
    } | null;
    episodes?: number | null;
    averageScore?: number | null;
    status?: string | null;
    season?: string | null;
    seasonYear?: number | null;
    format?: string | null;
    countryOfOrigin?: string | null;
    popularity?: number | null;
    coverImage?: {
      large?: string | null;
      medium?: string | null;
      color?: string | null;
    } | null;
    bannerImage?: string | null;
  } | null;
}

export interface EpisodeListItem {
  id: string;
  anime_id: string;
  episode_number: number;
  episode_title?: string | null;
  has_subtitle: boolean;
  subtitle_langs: string[];
  thumbnail?: string | null;
}

export interface SubtitleTrack {
  lang: string;
  label: string;
  url: string;
  is_default: boolean;
}

export interface AnimeEpisodeResponse {
  id: string;
  anime_id: string;
  episode_number: number;
  episode_title?: string | null;
  video_urls: Record<string, string>;
  subtitles: SubtitleTrack[];
  video_type?: string | null;
  intro?: { start: number; end: number } | null;
  outro?: { start: number; end: number } | null;
  url_expires_at?: string | null;
}

export interface Provider {
  id: number;
  name: string;
  slug: string;
  base_url: string | null;
  drama_count?: number;
  episode_count?: number;
}

export interface Tag {
  id: number;
  name: string;
  en_name?: string | null;
  drama_count?: number;
}

export interface WatchHistoryEntry {
  id: string;
  device_id: string;
  drama_id: string;
  episode_id: string;
  episode_index: number;
  progress_seconds: number;
  duration_seconds: number;
  completed: boolean;
  watched_at: string;
  drama_title: string;
  drama_cover_url: string | null;
  provider_name: string;
  provider_slug: string;
  chapter_count: number | null;
  episode_name: string | null;
}

export interface BookmarkEntry {
  id: string;
  drama_id: string;
  created_at: string;
  title: string;
  cover_url: string | null;
  provider_name: string;
  provider_slug: string;
  chapter_count: number | null;
  is_dubbed: boolean;
}

export interface Comment {
  id: string;
  content_id: string;
  episode_number: number;
  parent_id: string | null;
  user_id: string;
  user_name: string;
  user_avatar: string | null;
  body: string;
  like_count: number;
  user_liked: boolean;
  is_deleted: boolean;
  created_at: string;
}

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
