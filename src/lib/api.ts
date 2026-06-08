import type {
  GodenListEnvelope,
  GodenEnvelope,
  GodenListItem,
  DracinDetail,
  DracinSourcesData,
  AnimeDetail,
  AnimeSourcesData,
  AnimeDownloadData,
  GodenEpisode,
  MovieDetail,
  GodenSource,
  AuthUser,
  PaginatedResponse,
} from "@/types";

const IS_BROWSER = typeof window !== "undefined";
const API_PROXY = "/api/proxy";
const UPSTREAM = process.env.UPSTREAM_API_URL || "https://goden.store";
const GODEN_API_KEY = process.env.GODEN_API_KEY || process.env.API_KEY;

// ─── Core fetch helpers ───────────────────────────────────────────

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const base = IS_BROWSER ? API_PROXY : UPSTREAM;
  const url = `${base}${path}`;
  const headers: Record<string, string> = {
    ...(init?.headers as Record<string, string>),
  };

  // Server-side: inject X-API-Key directly for content endpoints
  if (!IS_BROWSER && path.startsWith("/api/v1/") && !path.startsWith("/api/v1/auth")) {
    if (GODEN_API_KEY) headers["X-API-Key"] = GODEN_API_KEY;
  }

  const res = await fetch(url, { ...init, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { detail?: string })?.detail || `API error ${res.status}`,
    );
  }
  return res.json() as Promise<T>;
}

async function userFetch<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_PROXY}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers as Record<string, string>),
    },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`Auth API error ${res.status}`);
  return res.json() as Promise<T>;
}

// ─── Source selector helpers ──────────────────────────────────────

/** Returns the best direct-playback URL (HLS preferred, then MP4). Returns null if only embed. */
export function pickBestVideoUrl(sources: GodenSource[]): string | null {
  const hls = sources.find(
    (s) => s.type === "hls" || s.url?.endsWith(".m3u8"),
  );
  if (hls) return hls.url;
  const mp4 = sources.find((s) => s.type === "mp4");
  if (mp4) return mp4.url;
  return null;
}

/** Returns the embed URL if only iframe-based playback is available. */
export function pickEmbedUrl(sources: GodenSource[]): string | null {
  return sources.find((s) => s.type === "embed")?.url ?? null;
}

// ─── Drama (short drama, formerly "dracin") ───────────────────────
// Backend renamed /api/v1/dracin/* → /api/v1/drama/* (2026-06-08).
// Function names kept as fetchDracin* so callers stay unchanged.

export async function fetchDracinLatest(
  page = 1,
): Promise<GodenListEnvelope<GodenListItem>> {
  return apiFetch<GodenListEnvelope<GodenListItem>>(
    `/api/v1/drama/latest?page=${page}`,
  );
}

export async function fetchDracinSearch(
  query: string,
  page = 1,
): Promise<GodenListEnvelope<GodenListItem>> {
  const qs = new URLSearchParams({ q: query, page: String(page) });
  return apiFetch<GodenListEnvelope<GodenListItem>>(
    `/api/v1/drama/search?${qs}`,
  );
}

export async function fetchDracinDetail(
  slug: string,
): Promise<GodenEnvelope<DracinDetail>> {
  return apiFetch<GodenEnvelope<DracinDetail>>(
    `/api/v1/drama/${encodeURIComponent(slug)}`,
  );
}

export async function fetchDracinEpisodes(
  slug: string,
): Promise<GodenEnvelope<GodenEpisode[]>> {
  return apiFetch<GodenEnvelope<GodenEpisode[]>>(
    `/api/v1/drama/${encodeURIComponent(slug)}/episodes`,
  );
}

export async function fetchDracinEpisodeSources(
  episodeSlug: string,
): Promise<GodenEnvelope<DracinSourcesData>> {
  return apiFetch<GodenEnvelope<DracinSourcesData>>(
    `/api/v1/drama/episode/${encodeURIComponent(episodeSlug)}/sources`,
  );
}

// ─── Anime ────────────────────────────────────────────────────────

export async function fetchAnimeLatest(
  page = 1,
): Promise<GodenListEnvelope<GodenListItem>> {
  return apiFetch<GodenListEnvelope<GodenListItem>>(
    `/api/v1/anime/latest?page=${page}`,
  );
}

export async function fetchAnimeSearch(
  query: string,
  page = 1,
): Promise<GodenListEnvelope<GodenListItem>> {
  const qs = new URLSearchParams({ q: query, page: String(page) });
  return apiFetch<GodenListEnvelope<GodenListItem>>(
    `/api/v1/anime/search?${qs}`,
  );
}

export async function fetchAnimeDetail(
  slug: string,
): Promise<GodenEnvelope<AnimeDetail>> {
  return apiFetch<GodenEnvelope<AnimeDetail>>(
    `/api/v1/anime/${encodeURIComponent(slug)}`,
  );
}

export async function fetchAnimeEpisodes(
  slug: string,
): Promise<GodenEnvelope<GodenEpisode[]>> {
  return apiFetch<GodenEnvelope<GodenEpisode[]>>(
    `/api/v1/anime/${encodeURIComponent(slug)}/episodes`,
  );
}

export async function fetchAnimeEpisodeSources(
  episodeSlug: string,
): Promise<GodenEnvelope<AnimeSourcesData>> {
  return apiFetch<GodenEnvelope<AnimeSourcesData>>(
    `/api/v1/anime/episode/${encodeURIComponent(episodeSlug)}/sources`,
  );
}

export async function fetchAnimeEpisodeDownloads(
  episodeSlug: string,
): Promise<GodenEnvelope<AnimeDownloadData>> {
  return apiFetch<GodenEnvelope<AnimeDownloadData>>(
    `/api/v1/anime/episode/${encodeURIComponent(episodeSlug)}/download`,
  );
}

// ─── Movie (entertainment, category=movie) ────────────────────────
// Backend merged /api/v1/movie/* + /api/v1/adult/* → /api/v1/entertainment/*
// with a `category` param (movie | adult | semi) (2026-06-08).

export async function fetchMovieLatest(
  page = 1,
  source?: string,
): Promise<GodenListEnvelope<GodenListItem>> {
  const qs = new URLSearchParams({ page: String(page), category: "movie" });
  if (source) qs.set("source", source);
  return apiFetch<GodenListEnvelope<GodenListItem>>(
    `/api/v1/entertainment/latest?${qs}`,
  );
}

export async function fetchMovieSearch(
  query: string,
  page = 1,
  source?: string,
): Promise<GodenListEnvelope<GodenListItem>> {
  const qs = new URLSearchParams({ q: query, page: String(page), category: "movie" });
  if (source) qs.set("source", source);
  return apiFetch<GodenListEnvelope<GodenListItem>>(
    `/api/v1/entertainment/search?${qs}`,
  );
}

export async function fetchMovieDetail(
  slug: string,
  source?: string,
): Promise<GodenEnvelope<MovieDetail>> {
  const qs = new URLSearchParams({ category: "movie" });
  if (source) qs.set("source", source);
  return apiFetch<GodenEnvelope<MovieDetail>>(
    `/api/v1/entertainment/${encodeURIComponent(slug)}?${qs}`,
  );
}

export async function fetchMovieSources(
  slug: string,
  source?: string,
): Promise<GodenEnvelope<{ title: string; slug: string; sources: GodenSource[]; source?: string }>> {
  const qs = new URLSearchParams({ category: "movie" });
  if (source) qs.set("source", source);
  return apiFetch(
    `/api/v1/entertainment/${encodeURIComponent(slug)}/sources?${qs}`,
  );
}

// ─── Comic ────────────────────────────────────────────────────────

export async function fetchComicLatest(
  page = 1,
  source = "auto",
): Promise<GodenListEnvelope<GodenListItem>> {
  const qs = new URLSearchParams({ page: String(page), source });
  return apiFetch<GodenListEnvelope<GodenListItem>>(
    `/api/v1/comic/latest?${qs}`,
  );
}

export async function fetchComicSearch(
  query: string,
  page = 1,
  source = "auto",
): Promise<GodenListEnvelope<GodenListItem>> {
  const qs = new URLSearchParams({ q: query, page: String(page), source });
  return apiFetch<GodenListEnvelope<GodenListItem>>(
    `/api/v1/comic/search?${qs}`,
  );
}

export async function fetchComicDetail(
  slug: string,
  source = "auto",
): Promise<GodenEnvelope<import("@/types").ComicDetail>> {
  return apiFetch<GodenEnvelope<import("@/types").ComicDetail>>(
    `/api/v1/comic/${encodeURIComponent(slug)}?source=${source}`,
  );
}

export async function fetchComicChapterImages(
  chapterSlug: string,
  source = "auto",
): Promise<GodenEnvelope<string[]>> {
  return apiFetch<GodenEnvelope<string[]>>(
    `/api/v1/comic/chapter/${encodeURIComponent(chapterSlug)}/images?source=${source}`,
  );
}

// ─── Donghua ──────────────────────────────────────────────────────

export async function fetchDonghuaLatest(
  page = 1,
  source = "auto",
): Promise<GodenListEnvelope<GodenListItem>> {
  const qs = new URLSearchParams({ page: String(page), source });
  return apiFetch<GodenListEnvelope<GodenListItem>>(
    `/api/v1/donghua/latest?${qs}`,
  );
}

export async function fetchDonghuaSearch(
  query: string,
  page = 1,
  source = "auto",
): Promise<GodenListEnvelope<GodenListItem>> {
  const qs = new URLSearchParams({ q: query, page: String(page), source });
  return apiFetch<GodenListEnvelope<GodenListItem>>(
    `/api/v1/donghua/search?${qs}`,
  );
}

export async function fetchDonghuaDetail(
  slug: string,
  source = "auto",
): Promise<GodenEnvelope<import("@/types").DonghuaDetail>> {
  return apiFetch<GodenEnvelope<import("@/types").DonghuaDetail>>(
    `/api/v1/donghua/${encodeURIComponent(slug)}?source=${source}`,
  );
}

export async function fetchDonghuaEpisodes(
  slug: string,
): Promise<GodenEnvelope<GodenEpisode[]>> {
  return apiFetch<GodenEnvelope<GodenEpisode[]>>(
    `/api/v1/donghua/${encodeURIComponent(slug)}/episodes`,
  );
}

export async function fetchDonghuaEpisodeSources(
  episodeSlug: string,
  source = "auto",
): Promise<GodenEnvelope<AnimeSourcesData>> {
  return apiFetch<GodenEnvelope<AnimeSourcesData>>(
    `/api/v1/donghua/episode/${encodeURIComponent(episodeSlug)}?source=${source}`,
  );
}

// ─── Adult (entertainment, category=adult) ────────────────────────

export async function fetchAdultLatest(
  page = 1,
): Promise<GodenListEnvelope<GodenListItem>> {
  const qs = new URLSearchParams({ page: String(page), category: "adult" });
  return apiFetch<GodenListEnvelope<GodenListItem>>(
    `/api/v1/entertainment/latest?${qs}`,
  );
}

export async function fetchAdultSearch(
  query: string,
): Promise<GodenListEnvelope<GodenListItem>> {
  const qs = new URLSearchParams({ q: query, category: "adult" });
  return apiFetch<GodenListEnvelope<GodenListItem>>(
    `/api/v1/entertainment/search?${qs}`,
  );
}

export async function fetchAdultDetail(
  videoId: string,
): Promise<GodenEnvelope<import("@/types").AdultDetail>> {
  const qs = new URLSearchParams({ category: "adult" });
  return apiFetch<GodenEnvelope<import("@/types").AdultDetail>>(
    `/api/v1/entertainment/${encodeURIComponent(videoId)}?${qs}`,
  );
}

// ─── Auth (user-facing, Bearer JWT) ──────────────────────────────

export async function fetchAuthMe(token: string): Promise<AuthUser> {
  return userFetch<AuthUser>("/api/v1/auth/me", token);
}

/** Google OAuth login — redirect the browser to this URL */
export function getGoogleLoginUrl(): string {
  return `${API_PROXY}/api/v1/auth/google/login`;
}

// ─── InfiniteGrid adapter ─────────────────────────────────────────
// Convert goden.store GodenListEnvelope to the PaginatedResponse shape
// that InfiniteGrid expects. HasMore is derived from data.length > 0
// because goden.store only reports items-on-page, not total in DB.

export function toPaginated<T>(
  envelope: GodenListEnvelope<T>,
  page: number,
): PaginatedResponse<T> {
  const hasMore = envelope.data.length > 0;
  const perPage = Math.max(envelope.data.length, 20);
  return {
    data: envelope.data,
    meta: {
      page,
      per_page: perPage,
      total: hasMore ? (page + 1) * perPage : page * perPage,
      total_pages: hasMore ? page + 1 : page,
    },
  };
}
