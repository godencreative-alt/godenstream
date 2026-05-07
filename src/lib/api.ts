import type {
  Drama,
  DramaDetail,
  Episode,
  PaginatedResponse,
  Provider,
  Tag,
  AnimeItem,
  AnimeDetail,
  EpisodeListItem,
  AnimeEpisodeResponse,
  WatchHistoryEntry,
  BookmarkEntry,
} from "@/types";
import { getAuthToken } from "./auth";
import { getDeviceId } from "./device";

const IS_BROWSER = typeof window !== "undefined";
const API_PROXY = "/api/proxy";
const UPSTREAM = process.env.UPSTREAM_API_URL || "https://api.example.com";

interface Meta {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const base = IS_BROWSER ? API_PROXY : UPSTREAM;
  const url = `${base}${path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string>),
  };

  if (!IS_BROWSER && process.env.API_KEY) {
    headers["Authorization"] = `Bearer ${process.env.API_KEY}`;
  }

  const res = await fetch(url, { ...init, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { error?: { message?: string } })?.error?.message ||
        `API error ${res.status}`,
    );
  }
  return res.json() as Promise<T>;
}

async function userFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAuthToken();
  const deviceId = getDeviceId();

  const res = await fetch(`/api/proxy${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(deviceId && { "X-Device-Id": deviceId }),
      ...(init?.headers as Record<string, string>),
    },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`User API error ${res.status}`);
  return res.json() as Promise<T>;
}

// ─── Drama API ──────────────────────────────────────────────────

interface DramaListParams {
  page?: number;
  per_page?: number;
  provider?: string;
  tag?: string;
  language?: string;
  sort_by?:
    | "updated_at"
    | "play_count"
    | "chapter_count"
    | "created_at"
    | "title";
  sort_order?: "asc" | "desc";
}

export async function fetchDramas(
  params: DramaListParams,
): Promise<PaginatedResponse<Drama>> {
  const qs = new URLSearchParams();
  if (params.page) qs.set("page", String(params.page));
  if (params.per_page) qs.set("per_page", String(params.per_page));
  if (params.provider) qs.set("provider", params.provider);
  if (params.tag) qs.set("tag", params.tag);
  if (params.language) qs.set("language", params.language);
  if (params.sort_by) qs.set("sort_by", params.sort_by);
  if (params.sort_order) qs.set("sort_order", params.sort_order);
  const res = await apiFetch<{ data: { dramas: Drama[]; meta: Meta } }>(
    `/api/dramas?${qs}`,
  );
  return { data: res.data.dramas, meta: res.data.meta };
}

export async function fetchDramaDetail(id: string): Promise<DramaDetail> {
  const res = await apiFetch<{ data: { drama: DramaDetail } }>(
    `/api/dramas/${id}`,
  );
  return res.data.drama;
}

export async function fetchDramaEpisodes(
  id: string,
  page = 1,
  perPage = 100,
): Promise<PaginatedResponse<Episode>> {
  const res = await apiFetch<{ data: { episodes: Episode[]; meta: Meta } }>(
    `/api/dramas/${id}/episodes?page=${page}&per_page=${perPage}`,
  );
  return { data: res.data.episodes, meta: res.data.meta };
}

export async function fetchDramaTrending(params?: {
  per_page?: number;
}): Promise<PaginatedResponse<Drama>> {
  const res = await apiFetch<{ data: { dramas: Drama[]; meta: Meta } }>(
    `/api/dramas/trending?per_page=${params?.per_page ?? 16}`,
  );
  return { data: res.data.dramas, meta: res.data.meta };
}

export async function fetchDramaPopular(params?: {
  per_page?: number;
  language?: string;
}): Promise<PaginatedResponse<Drama>> {
  const qs = new URLSearchParams({
    per_page: String(params?.per_page ?? 16),
  });
  if (params?.language) qs.set("language", params.language);
  const res = await apiFetch<{ data: { dramas: Drama[]; meta: Meta } }>(
    `/api/dramas/popular?${qs}`,
  );
  return { data: res.data.dramas, meta: res.data.meta };
}

export async function fetchSearch(
  query: string,
  params?: { per_page?: number },
): Promise<PaginatedResponse<Drama>> {
  const qs = new URLSearchParams({
    q: query,
    per_page: String(params?.per_page ?? 24),
  });
  const res = await apiFetch<{ data: { dramas: Drama[]; meta: Meta } }>(
    `/api/search?${qs}`,
  );
  return { data: res.data.dramas, meta: res.data.meta };
}

export async function fetchAlphabetCounts(): Promise<Record<string, number>> {
  const res = await apiFetch<{ data: Record<string, number> }>(
    "/api/dramas/alphabet",
  );
  return res.data;
}

export async function fetchAlphabetDramas(letter: string): Promise<Drama[]> {
  const res = await apiFetch<{ data: { dramas: Drama[] } }>(
    `/api/dramas/alphabet/${letter}`,
  );
  return res.data.dramas;
}

export async function fetchProviders(): Promise<Provider[]> {
  const res = await apiFetch<{ data: { providers: Provider[] } }>(
    "/api/providers",
  );
  return res.data.providers;
}

export async function fetchTags(): Promise<Tag[]> {
  const res = await apiFetch<{ data: { tags: Tag[] } }>("/api/tags");
  return res.data.tags;
}

// ─── Anime API ──────────────────────────────────────────────────

export async function fetchAnimeList(params: {
  page?: number;
  per_page?: number;
  genre?: string;
  sort_by?: string;
}): Promise<PaginatedResponse<AnimeItem>> {
  const qs = new URLSearchParams();
  if (params.page) qs.set("page", String(params.page));
  if (params.per_page) qs.set("per_page", String(params.per_page));
  if (params.genre) qs.set("genre", params.genre);
  if (params.sort_by) qs.set("sort_by", params.sort_by);
  const res = await apiFetch<{ data: AnimeItem[]; meta: Meta }>(
    `/api/anime?${qs}`,
  );
  return { data: res.data, meta: res.meta };
}

export async function fetchAnimeDetail(id: string): Promise<AnimeDetail> {
  const res = await apiFetch<{ data: AnimeDetail }>(`/api/anime/${id}`);
  return res.data;
}

export async function fetchAnimeEpisodes(
  id: string,
  page = 1,
  perPage = 100,
): Promise<PaginatedResponse<EpisodeListItem>> {
  const res = await apiFetch<{ data: EpisodeListItem[]; meta: Meta }>(
    `/api/anime/${id}/episodes?page=${page}&per_page=${perPage}`,
  );
  return { data: res.data, meta: res.meta };
}

export async function fetchAnimeEpisode(
  id: string,
  epNumber: number,
): Promise<AnimeEpisodeResponse> {
  const res = await apiFetch<{ data: AnimeEpisodeResponse }>(
    `/api/anime/${id}/episodes/${epNumber}`,
  );
  return res.data;
}

export async function fetchAnimePopular(params?: {
  per_page?: number;
}): Promise<PaginatedResponse<AnimeItem>> {
  const res = await apiFetch<{ data: AnimeItem[]; meta: Meta }>(
    `/api/anime/popular?per_page=${params?.per_page ?? 16}`,
  );
  return { data: res.data, meta: res.meta };
}

export async function fetchAnimeSearch(
  query: string,
): Promise<PaginatedResponse<AnimeItem>> {
  const qs = new URLSearchParams({ q: query, per_page: "24" });
  const res = await apiFetch<{ data: AnimeItem[]; meta: Meta }>(
    `/api/anime/search?${qs}`,
  );
  return { data: res.data, meta: res.meta };
}

// ─── MovieBox / iQIYI / WeTV API ────────────────────────────────

export async function fetchMovieBoxList(
  params: DramaListParams,
): Promise<PaginatedResponse<Drama>> {
  const qs = new URLSearchParams();
  if (params.page) qs.set("page", String(params.page));
  if (params.per_page) qs.set("per_page", String(params.per_page));
  if (params.provider) qs.set("provider", params.provider);
  if (params.sort_by) qs.set("sort_by", params.sort_by);
  const res = await apiFetch<{ data: { dramas: Drama[]; meta: Meta } }>(
    `/api/moviebox?${qs}`,
  );
  return { data: res.data.dramas, meta: res.data.meta };
}

export async function fetchIqiyiList(
  params: DramaListParams,
): Promise<PaginatedResponse<Drama>> {
  const qs = new URLSearchParams();
  if (params.page) qs.set("page", String(params.page));
  if (params.per_page) qs.set("per_page", String(params.per_page));
  if (params.sort_by) qs.set("sort_by", params.sort_by);
  const res = await apiFetch<{ data: { dramas: Drama[]; meta: Meta } }>(
    `/api/iqiyi?${qs}`,
  );
  return { data: res.data.dramas, meta: res.data.meta };
}

export async function fetchIqiyiDetail(id: string): Promise<DramaDetail> {
  const res = await apiFetch<{ data: { drama: DramaDetail } }>(
    `/api/iqiyi/${id}`,
  );
  return res.data.drama;
}

export async function fetchIqiyiEpisodes(
  id: string,
  page = 1,
  perPage = 100,
): Promise<PaginatedResponse<Episode>> {
  const res = await apiFetch<{ data: { episodes: Episode[]; meta: Meta } }>(
    `/api/iqiyi/${id}/episodes?page=${page}&per_page=${perPage}`,
  );
  return { data: res.data.episodes, meta: res.data.meta };
}

export async function fetchWetvList(
  params: DramaListParams,
): Promise<PaginatedResponse<Drama>> {
  const qs = new URLSearchParams();
  if (params.page) qs.set("page", String(params.page));
  if (params.per_page) qs.set("per_page", String(params.per_page));
  if (params.sort_by) qs.set("sort_by", params.sort_by);
  const res = await apiFetch<{ data: { dramas: Drama[]; meta: Meta } }>(
    `/api/wetv?${qs}`,
  );
  return { data: res.data.dramas, meta: res.data.meta };
}

export async function fetchWetvDetail(id: string): Promise<DramaDetail> {
  const res = await apiFetch<{ data: { drama: DramaDetail } }>(
    `/api/wetv/${id}`,
  );
  return res.data.drama;
}

export async function fetchWetvEpisodes(
  id: string,
  page = 1,
  perPage = 100,
): Promise<PaginatedResponse<Episode>> {
  const res = await apiFetch<{ data: { episodes: Episode[]; meta: Meta } }>(
    `/api/wetv/${id}/episodes?page=${page}&per_page=${perPage}`,
  );
  return { data: res.data.episodes, meta: res.data.meta };
}

// ─── User API (authenticated) ───────────────────────────────────

export async function fetchWatchHistory(params?: {
  per_page?: number;
}): Promise<PaginatedResponse<WatchHistoryEntry>> {
  return userFetch<PaginatedResponse<WatchHistoryEntry>>(
    `/api/user/history?per_page=${params?.per_page ?? 20}`,
  );
}

export async function upsertWatchProgress(data: {
  drama_id: number;
  episode_id: number;
  progress_seconds: number;
  duration_seconds: number;
}): Promise<void> {
  await userFetch("/api/user/history", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function fetchBookmarks(): Promise<
  PaginatedResponse<BookmarkEntry>
> {
  return userFetch<PaginatedResponse<BookmarkEntry>>("/api/user/bookmarks");
}

export async function toggleBookmark(dramaId: number): Promise<void> {
  await userFetch("/api/user/bookmarks", {
    method: "POST",
    body: JSON.stringify({ drama_id: dramaId }),
  });
}

export async function fetchComments(
  contentId: string,
  episodeNumber: number,
) {
  return apiFetch<{ data: import("@/types").Comment[] }>(
    `/api/comments?content_id=${contentId}&episode_number=${episodeNumber}`,
  );
}

export async function postComment(data: {
  content_id: string;
  episode_number: number;
  body: string;
  parent_id?: string;
}) {
  return userFetch("/api/comments", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function likeComment(commentId: string) {
  return userFetch(`/api/comments/${commentId}/like`, { method: "POST" });
}

export async function deleteComment(commentId: string) {
  return userFetch(`/api/comments/${commentId}`, { method: "DELETE" });
}
