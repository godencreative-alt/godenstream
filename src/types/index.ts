// -- Drama ----------------------------------------------------------------

export interface Drama {
  id: number;
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
  created_at?: string;
  updated_at?: string;
  raw_data?: {
    release_year?: number;
    subject?: { releaseDate?: string };
    tmdb?: {
      id?: number;
      imdb_id?: string;
      original_title?: string;
      original_language?: string;
      overview?: string;
      tagline?: string;
      status?: string;
      popularity?: number;
      release_date?: string;
      runtime?: number;
      vote_average?: number;
      vote_count?: number;
      certification?: string;
      genres?: { id?: number; name: string }[];
      keywords?: { id?: number; name: string }[];
      cast?: {
        name: string;
        character?: string;
        profile_path?: string;
        order?: number;
      }[];
      directors?: { name: string; profile_path?: string }[];
      poster_path?: string;
      backdrop_path?: string;
      backdrops?: {
        file_path: string;
        width?: number;
        height?: number;
      }[];
      trailers?: {
        key: string;
        site: string;
        type: string;
        name?: string;
      }[];
      number_of_seasons?: number;
      number_of_episodes?: number;
    };
  } | null;
}

export interface Tag {
  id: number;
  name: string;
  en_name?: string | null;
  drama_count?: number;
}

export interface Provider {
  id: number;
  name: string;
  slug: string;
  base_url: string | null;
  drama_count?: number;
  episode_count?: number;
}

export interface Episode {
  id: number;
  drama_id: number;
  episode_index: number;
  episode_name: string | null;
  video_url: string | null;
  subtitle_url: string | null;
  subtitles: { lang: string; url: string }[] | null;
  qualities: Record<string, string> | null;
  status: string;
  duration_seconds?: number | null;
}

export interface DramaDetail extends Drama {
  tags?: Tag[];
  episodes?: Episode[];
  episode_count?: number;
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

// -- Anime ----------------------------------------------------------------

export interface AnilistTitle {
  romaji?: string | null;
  english?: string | null;
  native?: string | null;
}

export interface AnilistData {
  title?: AnilistTitle | null;
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
  anilist_data?: AnilistData | null;
}

export type AnimeDetail = AnimeItem;

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

export interface AnimePaginatedResponse<T> {
  data: T[];
  meta: { page: number; per_page: number; total: number; total_pages: number };
}

// -- Watch History & Bookmarks --------------------------------------------

export interface WatchHistoryEntry {
  id: string;
  device_id: string;
  drama_id: number;
  episode_id: number;
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
  drama_id: number;
  created_at: string;
  title: string;
  cover_url: string | null;
  provider_name: string;
  provider_slug: string;
  chapter_count: number | null;
  is_dubbed: boolean;
}

// -- Auth -----------------------------------------------------------------

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  email_verified: boolean;
  is_admin: boolean;
  subscription_tier?: string;
  subscription_expires_at?: string | null;
  avatar_url?: string | null;
}

// -- Comments -------------------------------------------------------------

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
