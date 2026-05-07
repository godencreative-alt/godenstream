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
const UPSTREAM = process.env.UPSTREAM_API_URL || "https://captain.sapimu.au";
const DEFAULT_API_KEY = process.env.API_KEY || process.env.NEXT_PUBLIC_API_TOKEN;

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

  if (!IS_BROWSER && DEFAULT_API_KEY) {
    headers["Authorization"] = `Bearer ${DEFAULT_API_KEY}`;
    headers["Cookie"] = `auth_token=${DEFAULT_API_KEY}`;
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

function toArray(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value)
    ? value.filter((item): item is Record<string, unknown> => isRecord(item))
    : [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function numberValue(value: unknown): number | undefined {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
}

function pickString(source: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = stringValue(source[key]);
    if (value) return value;
  }
}

function pickNumber(source: Record<string, unknown>, keys: string[]): number | undefined {
  for (const key of keys) {
    const value = numberValue(source[key]);
    if (value !== undefined) return value;
  }
}

function shordramaMeta(page: number, perPage: number, total?: number): Meta {
  const safeTotal = total ?? page * perPage + 1;
  return {
    page,
    per_page: perPage,
    total: safeTotal,
    total_pages: total ? Math.max(1, Math.ceil(total / perPage)) : page + 1,
  };
}

function mapShordramaItem(
  item: Record<string, unknown>,
  provider: ShordramaPlatform,
): Drama {
  const id =
    pickString(item, ["id", "bookId", "book_id"]) ||
    String(pickNumber(item, ["id", "bookId", "book_id"]) ?? "");
  const title =
    pickString(item, ["title", "bookName", "book_name", "short_play_name"]) ||
    "Untitled";
  const cover =
    pickString(item, [
      "cover_url",
      "compress_cover_url",
      "coverWap",
      "cover",
      "thumb_url",
      "first_chapter_cover",
    ]) || null;

  return {
    id: Number(id) || Math.abs(hashId(`${provider.slug}:${id || title}`)),
    title,
    cover_url: cover,
    provider_id: provider.id,
    provider_name: provider.name,
    provider_slug: provider.slug,
    chapter_count:
      pickNumber(item, [
        "chapterCount",
        "totalEpisodes",
        "serial_count",
        "current_count",
        "last_chapter_index",
      ]) ?? null,
    play_count: pickNumber(item, ["playCount", "view_count", "read_count"]) ?? 0,
    introduction: pickString(item, ["introduction", "description", "abstract"]) || null,
    language: pickString(item, ["lang", "language"]) || null,
    is_dubbed:
      Boolean(item.is_dubbed) ||
      String(item.cover_tag ?? item.title ?? "").toLowerCase().includes("dub"),
    raw_data: null,
  };
}

function hashId(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

function extractDramaboxBooks(data: unknown): Record<string, unknown>[] {
  if (!isRecord(data)) return [];
  const payload = data.data;
  if (!isRecord(payload)) return [];
  const nested = payload.data;
  if (!isRecord(nested)) return [];
  const rankList = toArray(nested.rankList);
  if (rankList.length > 0) return rankList;
  const searchList = toArray(nested.searchList);
  if (searchList.length > 0) return searchList;
  return toArray(nested.sections).flatMap((section) => toArray(section.books));
}

function extractMeloloBooks(data: unknown): Record<string, unknown>[] {
  if (!isRecord(data) || !isRecord(data.cell)) return [];
  return toArray(data.cell.cell_data).flatMap((cell) => toArray(cell.books));
}

function extractIdramaBooks(data: unknown): Record<string, unknown>[] {
  if (!isRecord(data)) return [];
  return toArray(data.short_plays);
}

function extractDataBooks(data: unknown): Record<string, unknown>[] {
  if (!isRecord(data)) return [];
  return toArray(data.data);
}

export const SHORDRAMA_PLATFORMS = [
  {
    id: 1,
    slug: "drama-id",
    name: "Drama-ID",
    apiBase: "/idrama",
    language: "id",
    latestPath: (page: number, perPage: number) =>
      `/api/v1/latest?page=${page}&limit=${perPage}&lang=id`,
    popularPath: (page: number, perPage: number) =>
      `/api/v1/popular?page=${page}&limit=${perPage}&lang=id`,
    trendingPath: (page: number, perPage: number) =>
      `/api/v1/ranking/trending?page=${page}&limit=${perPage}&lang=id`,
    extract: extractIdramaBooks,
  },
  {
    id: 2,
    slug: "dramabox",
    name: "DramaBox",
    apiBase: "/dramaboxv4",
    language: "in",
    latestPath: (page: number, perPage: number) =>
      `/api/home?page=${page}&size=${perPage}&lang=in`,
    popularPath: () => "/api/rank?lang=in",
    trendingPath: () => "/api/rank?lang=in",
    extract: extractDramaboxBooks,
  },
  {
    id: 3,
    slug: "melolo",
    name: "Melolo",
    apiBase: "/melolo",
    language: "id",
    latestPath: (page: number) => `/api/v1/bookmall?lang=id&page=${page}`,
    popularPath: (page: number) => `/api/v1/bookmall?lang=id&page=${page}`,
    trendingPath: (page: number) => `/api/v1/bookmall?lang=id&page=${page}`,
    extract: extractMeloloBooks,
  },
  {
    id: 4,
    slug: "netshort",
    name: "NetShort",
    apiBase: "/netshort",
    language: "id_ID",
    latestPath: (page: number) => `/api/v1/new/${page}?lang=id_ID`,
    popularPath: (page: number) => `/api/v1/feed/${page}?lang=id_ID`,
    trendingPath: (page: number) => `/api/v1/explore/${page}?lang=id_ID`,
    extract: extractDataBooks,
  },
  {
    id: 5,
    slug: "freereels",
    name: "FreeReels",
    apiBase: "/freereels",
    language: "id-ID",
    latestPath: (page: number) => `/api/v1/new?page=${Math.max(0, page - 1)}&lang=id-ID`,
    popularPath: (page: number) =>
      `/api/v1/popular?page=${Math.max(0, page - 1)}&lang=id-ID`,
    trendingPath: () => "/api/v1/foryou?lang=id-ID",
    extract: extractDataBooks,
  },
] as const;

export type ShordramaPlatform = (typeof SHORDRAMA_PLATFORMS)[number];
export type ShordramaPlatformSlug = ShordramaPlatform["slug"];
export type ShordramaSort = "trending" | "popular" | "latest";

export function getShordramaPlatform(
  slug: string,
): ShordramaPlatform | undefined {
  return SHORDRAMA_PLATFORMS.find((platform) => platform.slug === slug);
}

export async function fetchShordramaPlatformList({
  platform,
  sort = "latest",
  page = 1,
  per_page = 10,
}: {
  platform: ShordramaPlatformSlug | string;
  sort?: ShordramaSort;
  page?: number;
  per_page?: number;
}): Promise<PaginatedResponse<Drama>> {
  const selected = getShordramaPlatform(platform);
  if (!selected) {
    return { data: [], meta: shordramaMeta(page, per_page, 0) };
  }

  const pathFactory =
    sort === "trending"
      ? selected.trendingPath
      : sort === "popular"
        ? selected.popularPath
        : selected.latestPath;
  const res = await apiFetch<unknown>(
    `${selected.apiBase}${pathFactory(page, per_page)}`,
  );
  const data = selected
    .extract(res)
    .slice(0, per_page)
    .map((item) => mapShordramaItem(item, selected));

  return {
    data,
    meta: shordramaMeta(page, per_page, data.length < per_page ? data.length : undefined),
  };
}

export async function fetchShordramaHome(): Promise<
  { platform: ShordramaPlatform; dramas: Drama[] }[]
> {
  const sections = await Promise.all(
    SHORDRAMA_PLATFORMS.map(async (platform) => {
      try {
        const res = await fetchShordramaPlatformList({
          platform: platform.slug,
          sort: "latest",
          page: 1,
          per_page: 10,
        });
        return { platform, dramas: res.data };
      } catch {
        return { platform, dramas: [] };
      }
    }),
  );
  return sections;
}

export async function fetchShordramaSort(
  sort: ShordramaSort,
  page = 1,
  perPage = 20,
): Promise<PaginatedResponse<Drama>> {
  const perPlatform = Math.max(4, Math.ceil(perPage / SHORDRAMA_PLATFORMS.length));
  const sections = await Promise.all(
    SHORDRAMA_PLATFORMS.map((platform) =>
      fetchShordramaPlatformList({
        platform: platform.slug,
        sort,
        page,
        per_page: perPlatform,
      }).catch(() => ({ data: [], meta: shordramaMeta(page, perPlatform, 0) })),
    ),
  );
  const data = sections.flatMap((section) => section.data).slice(0, perPage);
  return { data, meta: shordramaMeta(page, perPage) };
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
