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
  EntertainmentDetail,
  VaultResolveResponse,
} from "@/types";

const IS_BROWSER = typeof window !== "undefined";
const API_PROXY = "/api/proxy";
const UPSTREAM = process.env.UPSTREAM_API_URL || "https://api.godenpg.dev";
const GODEN_API_KEY = process.env.GODEN_API_KEY || process.env.API_KEY;

/** Append `source` to query params only when it is a real, non-auto source. */
function setSource(qs: URLSearchParams, source?: string): void {
  if (source && source !== "auto" && source !== "all") qs.set("source", source);
}

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
    const message = (body as { detail?: string; message?: string })?.detail
      || (body as { detail?: string; message?: string })?.message
      || `API error ${res.status}`;
    throw new Error(message);
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

/** Rewrite a relative backend asset path (/api/v1/...) to go through our
 *  same-origin proxy so the API key is attached and the URL is reachable
 *  from the browser. Absolute URLs are returned untouched. */
export function proxyAssetUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("/api/v1/")) return `/api/proxy${url}`;
  return url;
}

/** For iframe embeds (dailymotion, blogger, etc.), the backend's
 *  /api/v1/asset/<base64> wrapper is counterproductive: many embed hosts
 *  reject server-side fetches (502) but render fine when the browser
 *  loads them directly. So for type=embed we decode the base64 and use
 *  the original URL. Falls back to the proxy path on decode failure. */
function unwrapAssetUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const m = url.match(/^\/api\/v1\/asset\/([A-Za-z0-9+/_-]+=*)$/);
  if (!m) return url;
  try {
    let b64 = m[1].replace(/-/g, "+").replace(/_/g, "/");
    while (b64.length % 4) b64 += "=";
    const decoded = typeof atob === "function"
      ? atob(b64)
      : Buffer.from(b64, "base64").toString("utf-8");
    if (/^https?:\/\//i.test(decoded)) return decoded;
  } catch {
    /* fall through */
  }
  return proxyAssetUrl(url);
}

/** Returns the best direct-playback URL (HLS preferred, then MP4). Returns null if only embed. */
export function pickBestVideoUrl(sources: GodenSource[]): string | null {
  const hls = sources.find(
    (s) => s.type === "hls" || s.url?.endsWith(".m3u8"),
  );
  if (hls) return proxyAssetUrl(hls.url);
  const mp4 = sources.find((s) => s.type === "mp4");
  if (mp4) return proxyAssetUrl(mp4.url);
  return null;
}

/** Combined playback picker: returns the proxied best-src, its declared type,
 *  and a quality→proxied-url map all in one go. Lets watch pages avoid
 *  hand-rolling the same logic + the URL-comparison bug for sourceType. */
export function pickPlayback(sources: GodenSource[]): {
  src: string | null;
  sourceType: string | undefined;
  qualities: Record<string, string>;
} {
  const hls = sources.find(
    (s) => s.type === "hls" || s.url?.endsWith(".m3u8"),
  );
  const mp4 = sources.find((s) => s.type === "mp4");
  const best = hls ?? mp4;
  const qualities = Object.fromEntries(
    sources
      .filter((s) => (s.type === "hls" || s.type === "mp4") && s.url)
      .map((s) => [s.quality || s.type, proxyAssetUrl(s.url)!] as [string, string]),
  );
  return {
    src: best ? proxyAssetUrl(best.url) : null,
    sourceType: best?.type,
    qualities,
  };
}

/** Returns the embed URL if only iframe-based playback is available. */
export function pickEmbedUrl(sources: GodenSource[]): string | null {
  return unwrapAssetUrl(sources.find((s) => s.type === "embed")?.url ?? null);
}

function inferSourceType(url: string, fallback: string = "embed"): string {
  if (url.includes(".m3u8")) return "hls";
  if (/\.(mp4|webm|m4v)(\?|$)/i.test(url)) return "mp4";
  return fallback;
}

export function normalizeSources(
  sources: Array<Partial<GodenSource> & { url: string }>,
  fallbackType = "embed",
): GodenSource[] {
  return sources
    .filter((s) => !!s.url)
    .map((s) => ({
      ...s,
      type: s.type ?? inferSourceType(s.url, fallbackType),
      url: s.url,
    }));
}

function absolutizeVaultUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  const upstream = process.env.NEXT_PUBLIC_API_BASE || "https://api.godenpg.dev";
  return `${upstream}${url}`;
}

export function pickVaultPlayback(resolve: VaultResolveResponse | undefined | null): {
  src: string | null;
  sourceType: string | undefined;
  qualities: Record<string, string>;
} {
  if (!resolve || resolve.state !== "ready" || !resolve.data || !("files" in resolve.data)) {
    return { src: null, sourceType: undefined, qualities: {} };
  }
  const files = resolve.data.files ?? [];
  const videoFiles = files.filter((f) => f.kind === "video");
  const best = videoFiles[0] ?? files[0];
  const qualities = Object.fromEntries(
    videoFiles
      .filter((f) => !!f.stream_url)
      .map((f) => [f.quality || f.kind, absolutizeVaultUrl(f.stream_url)] as [string, string]),
  );
  return {
    src: best?.stream_url ? absolutizeVaultUrl(best.stream_url) : null,
    sourceType: best?.stream_url ? inferSourceType(best.stream_url, "mp4") : undefined,
    qualities,
  };
}

// ─── Drama (short drama, formerly "dracin") ───────────────────────
// Backend renamed /api/v1/dracin/* → /api/v1/drama/* (api.godenpg.dev).
// Function names kept as fetchDracin* so callers stay unchanged.

export async function fetchDracinLatest(
  page = 1,
  type = "drakor",
  genre?: string,
  source?: string,
): Promise<GodenListEnvelope<GodenListItem>> {
  const qs = new URLSearchParams({ page: String(page), type });
  if (genre && genre !== "all") qs.set("genre", genre);
  setSource(qs, source);
  return apiFetch<GodenListEnvelope<GodenListItem>>(
    `/api/v1/drama/latest?${qs}`,
  );
}

export async function fetchDracinPopular(
  page = 1,
  type = "drakor",
  genre?: string,
  source?: string,
): Promise<GodenListEnvelope<GodenListItem>> {
  const qs = new URLSearchParams({ page: String(page), type });
  if (genre && genre !== "all") qs.set("genre", genre);
  setSource(qs, source);
  return apiFetch<GodenListEnvelope<GodenListItem>>(
    `/api/v1/drama/popular?${qs}`,
  );
}

export async function fetchDracinSearch(
  query: string,
  page = 1,
  type = "drakor",
  genre?: string,
  source?: string,
): Promise<GodenListEnvelope<GodenListItem>> {
  const qs = new URLSearchParams({ q: query, page: String(page), type });
  if (genre && genre !== "all") qs.set("genre", genre);
  setSource(qs, source);
  return apiFetch<GodenListEnvelope<GodenListItem>>(
    `/api/v1/drama/search?${qs}`,
  );
}

export async function fetchDracinGenres(
  type = "drakor",
  source?: string,
): Promise<GodenListEnvelope<string>> {
  const qs = new URLSearchParams({ type });
  setSource(qs, source);
  return apiFetch<GodenListEnvelope<string>>(`/api/v1/drama/genres?${qs}`);
}

export async function fetchDracinDetail(
  slug: string,
  type = "drakor",
  source?: string,
): Promise<GodenEnvelope<DracinDetail>> {
  const qs = new URLSearchParams({ type });
  setSource(qs, source);
  return apiFetch<GodenEnvelope<DracinDetail>>(
    `/api/v1/drama/${encodeURIComponent(slug)}?${qs}`,
  );
}

export async function fetchDracinEpisodes(
  slug: string,
  type = "drakor",
  source?: string,
): Promise<GodenEnvelope<GodenEpisode[]>> {
  const qs = new URLSearchParams({ type });
  setSource(qs, source);
  return apiFetch<GodenEnvelope<GodenEpisode[]>>(
    `/api/v1/drama/${encodeURIComponent(slug)}/episodes?${qs}`,
  );
}

export async function fetchDracinEpisodeSources(
  episodeSlug: string,
  type = "drakor",
  source?: string,
): Promise<GodenEnvelope<DracinSourcesData>> {
  const qs = new URLSearchParams({ type });
  setSource(qs, source);
  return apiFetch<GodenEnvelope<DracinSourcesData>>(
    `/api/v1/drama/episode/${encodeURIComponent(episodeSlug)}/sources?${qs}`,
  );
}

// ─── Anime ────────────────────────────────────────────────────────

export async function fetchAnimeLatest(
  page = 1,
  genre?: string,
): Promise<GodenListEnvelope<GodenListItem>> {
  const qs = new URLSearchParams({ page: String(page) });
  if (genre && genre !== "all") qs.set("genre", genre);
  return apiFetch<GodenListEnvelope<GodenListItem>>(
    `/api/v1/anime/latest?${qs}`,
  );
}

export async function fetchAnimePopular(
  page = 1,
): Promise<GodenListEnvelope<GodenListItem>> {
  return apiFetch<GodenListEnvelope<GodenListItem>>(
    `/api/v1/anime/popular?page=${page}`,
  );
}

export async function fetchAnimeGenres(): Promise<GodenListEnvelope<string>> {
  return apiFetch<GodenListEnvelope<string>>(`/api/v1/anime/genres`);
}

export async function fetchAnimeSearch(
  query: string,
  page = 1,
  genre?: string,
): Promise<GodenListEnvelope<GodenListItem>> {
  const qs = new URLSearchParams({ q: query, page: String(page) });
  if (genre && genre !== "all") qs.set("genre", genre);
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

// ─── Movie (via /entertainment?subcategory=movie) ─────────────────

export async function fetchMovieLatest(
  page = 1,
  source?: string,
  genre?: string,
): Promise<GodenListEnvelope<GodenListItem>> {
  const qs = new URLSearchParams({ page: String(page), subcategory: "movie" });
  setSource(qs, source);
  if (genre && genre !== "all") qs.set("genre", genre);
  return apiFetch<GodenListEnvelope<GodenListItem>>(
    `/api/v1/entertainment/latest?${qs}`,
  );
}

export async function fetchMoviePopular(
  page = 1,
  source?: string,
): Promise<GodenListEnvelope<GodenListItem>> {
  const qs = new URLSearchParams({ page: String(page), subcategory: "movie" });
  setSource(qs, source);
  return apiFetch<GodenListEnvelope<GodenListItem>>(
    `/api/v1/entertainment/popular?${qs}`,
  );
}

export async function fetchMovieSearch(
  query: string,
  page = 1,
  source?: string,
  genre?: string,
): Promise<GodenListEnvelope<GodenListItem>> {
  const qs = new URLSearchParams({ q: query, page: String(page), subcategory: "movie" });
  setSource(qs, source);
  if (genre && genre !== "all") qs.set("genre", genre);
  return apiFetch<GodenListEnvelope<GodenListItem>>(
    `/api/v1/entertainment/search?${qs}`,
  );
}

export async function fetchMovieGenres(): Promise<GodenListEnvelope<string>> {
  return apiFetch<GodenListEnvelope<string>>(`/api/v1/entertainment/genres?subcategory=movie`);
}

export async function fetchMovieDetail(
  slug: string,
  source?: string,
): Promise<GodenEnvelope<MovieDetail>> {
  const qs = new URLSearchParams({ subcategory: "movie" });
  setSource(qs, source);
  const suffix = qs.size ? `?${qs}` : "?subcategory=movie";
  return apiFetch<GodenEnvelope<MovieDetail>>(
    `/api/v1/entertainment/${encodeURIComponent(slug)}${suffix}`,
  );
}

export async function fetchMovieSources(
  slug: string,
  source?: string,
): Promise<GodenEnvelope<{ title?: string; slug?: string; sources: GodenSource[]; source?: string }>> {
  const qs = new URLSearchParams({ subcategory: "movie" });
  setSource(qs, source);
  const suffix = qs.size ? `?${qs}` : "?subcategory=movie";
  const response = await apiFetch<GodenEnvelope<{ title?: string; slug?: string; sources?: GodenSource[]; source?: string }>>(
    `/api/v1/entertainment/${encodeURIComponent(slug)}/sources${suffix}`,
  );
  return {
    ...response,
    data: {
      ...response.data,
      sources: normalizeSources(response.data.sources ?? []),
    },
  };
}

// ─── Comic ────────────────────────────────────────────────────────

export async function fetchComicLatest(
  page = 1,
  opts?: { source?: string; type?: string; genre?: string },
): Promise<GodenListEnvelope<GodenListItem>> {
  const qs = new URLSearchParams({ page: String(page) });
  if (opts?.type) qs.set("type", opts.type);
  if (opts?.genre && opts.genre !== "all") qs.set("genre", opts.genre);
  setSource(qs, opts?.source ?? "auto");
  return apiFetch<GodenListEnvelope<GodenListItem>>(
    `/api/v1/comic/latest?${qs}`,
  );
}

export async function fetchComicPopular(
  page = 1,
  opts?: { source?: string; type?: string; genre?: string },
): Promise<GodenListEnvelope<GodenListItem>> {
  const qs = new URLSearchParams({ page: String(page) });
  if (opts?.type) qs.set("type", opts.type);
  if (opts?.genre && opts.genre !== "all") qs.set("genre", opts.genre);
  setSource(qs, opts?.source ?? "auto");
  return apiFetch<GodenListEnvelope<GodenListItem>>(
    `/api/v1/comic/popular?${qs}`,
  );
}

export async function fetchComicGenres(
  opts?: { source?: string; type?: string },
): Promise<GodenListEnvelope<string>> {
  const qs = new URLSearchParams();
  if (opts?.type) qs.set("type", opts.type);
  setSource(qs, opts?.source ?? "auto");
  const suffix = qs.size ? `?${qs}` : "";
  return apiFetch<GodenListEnvelope<string>>(`/api/v1/comic/genres${suffix}`);
}

export async function fetchComicSearch(
  query: string,
  page = 1,
  opts?: { source?: string; type?: string; genre?: string },
): Promise<GodenListEnvelope<GodenListItem>> {
  const qs = new URLSearchParams({ q: query, page: String(page) });
  if (opts?.type) qs.set("type", opts.type);
  if (opts?.genre && opts.genre !== "all") qs.set("genre", opts.genre);
  setSource(qs, opts?.source ?? "auto");
  return apiFetch<GodenListEnvelope<GodenListItem>>(
    `/api/v1/comic/search?${qs}`,
  );
}

export async function fetchComicChapters(
  slug: string,
  opts?: { source?: string; type?: string },
): Promise<GodenEnvelope<GodenEpisode[]>> {
  const qs = new URLSearchParams();
  if (opts?.type) qs.set("type", opts.type);
  setSource(qs, opts?.source ?? "auto");
  const suffix = qs.size ? `?${qs}` : "";
  return apiFetch<GodenEnvelope<GodenEpisode[]>>(
    `/api/v1/comic/${encodeURIComponent(slug)}/chapters${suffix}`,
  );
}

export async function fetchComicDetail(
  slug: string,
  opts?: { source?: string; type?: string },
): Promise<GodenEnvelope<import("@/types").ComicDetail>> {
  const qs = new URLSearchParams();
  if (opts?.type) qs.set("type", opts.type);
  setSource(qs, opts?.source ?? "auto");
  const suffix = qs.size ? `?${qs}` : "";
  const detail = await apiFetch<GodenEnvelope<import("@/types").ComicDetail>>(
    `/api/v1/comic/${encodeURIComponent(slug)}${suffix}`,
  );

  const chapters = await fetchComicChapters(slug, opts).catch(() => null);
  return {
    ...detail,
    data: {
      ...detail.data,
      chapters: chapters?.data ?? detail.data.chapters ?? [],
    },
  };
}

export async function fetchComicChapterImages(
  chapterSlug: string,
  opts?: { source?: string; type?: string },
): Promise<GodenEnvelope<string[]>> {
  const qs = new URLSearchParams();
  if (opts?.type) qs.set("type", opts.type);
  setSource(qs, opts?.source ?? "auto");
  const suffix = qs.size ? `?${qs}` : "";
  return apiFetch<GodenEnvelope<string[]>>(
    `/api/v1/comic/chapter/${encodeURIComponent(chapterSlug)}/images${suffix}`,
  );
}

// ─── Donghua ──────────────────────────────────────────────────────

export async function fetchDonghuaLatest(
  page = 1,
  source = "auto",
): Promise<GodenListEnvelope<GodenListItem>> {
  const qs = new URLSearchParams({ page: String(page) });
  setSource(qs, source);
  return apiFetch<GodenListEnvelope<GodenListItem>>(
    `/api/v1/donghua/latest?${qs}`,
  );
}

export async function fetchDonghuaPopular(
  page = 1,
): Promise<GodenListEnvelope<GodenListItem>> {
  // Backend popular endpoint hardcodes anichin and ignores `source`, so
  // don't bother sending it. (latest/search/detail still use it.)
  return apiFetch<GodenListEnvelope<GodenListItem>>(
    `/api/v1/donghua/popular?page=${page}`,
  );
}

export async function fetchDonghuaGenres(): Promise<GodenListEnvelope<string>> {
  return apiFetch<GodenListEnvelope<string>>(`/api/v1/donghua/genres`);
}

export async function fetchDonghuaSearch(
  query: string,
  page = 1,
  source = "anichin",
): Promise<GodenListEnvelope<GodenListItem>> {
  const qs = new URLSearchParams({ q: query, page: String(page) });
  setSource(qs, source);
  return apiFetch<GodenListEnvelope<GodenListItem>>(
    `/api/v1/donghua/search?${qs}`,
  );
}

export async function fetchDonghuaDetail(
  slug: string,
  source = "anichin",
): Promise<GodenEnvelope<import("@/types").DonghuaDetail>> {
  const qs = new URLSearchParams();
  setSource(qs, source);
  const suffix = qs.size ? `?${qs}` : "";
  return apiFetch<GodenEnvelope<import("@/types").DonghuaDetail>>(
    `/api/v1/donghua/${encodeURIComponent(slug)}${suffix}`,
  );
}

export async function fetchDonghuaEpisodes(
  slug: string,
  source = "anichin",
): Promise<GodenEnvelope<GodenEpisode[]>> {
  const qs = new URLSearchParams();
  setSource(qs, source);
  const suffix = qs.size ? `?${qs}` : "";
  return apiFetch<GodenEnvelope<GodenEpisode[]>>(
    `/api/v1/donghua/${encodeURIComponent(slug)}/episodes${suffix}`,
  );
}

export async function fetchDonghuaEpisodeSources(
  episodeSlug: string,
  source = "anichin",
): Promise<GodenEnvelope<AnimeSourcesData>> {
  const qs = new URLSearchParams();
  setSource(qs, source);
  const suffix = qs.size ? `?${qs}` : "";
  return apiFetch<GodenEnvelope<AnimeSourcesData>>(
    `/api/v1/donghua/episode/${encodeURIComponent(episodeSlug)}${suffix}`,
  );
}

// ─── Adult (via /entertainment?subcategory=adult&type=X) ──────────
// Backend type mapping: korea → asia (alias). Valid types: jav, asia, indonesia, west.

export async function fetchAdultLatest(
  page = 1,
  type = "west",
  source?: string,
  genre?: string,
): Promise<GodenListEnvelope<GodenListItem>> {
  const qs = new URLSearchParams({ page: String(page), subcategory: "adult", type });
  setSource(qs, source);
  if (genre && genre !== "all") qs.set("genre", genre);
  return apiFetch<GodenListEnvelope<GodenListItem>>(
    `/api/v1/entertainment/latest?${qs}`,
  );
}

export async function fetchAdultPopular(
  page = 1,
  type = "west",
  source?: string,
  genre?: string,
): Promise<GodenListEnvelope<GodenListItem>> {
  const qs = new URLSearchParams({ page: String(page), subcategory: "adult", type });
  setSource(qs, source);
  if (genre && genre !== "all") qs.set("genre", genre);
  return apiFetch<GodenListEnvelope<GodenListItem>>(
    `/api/v1/entertainment/popular?${qs}`,
  );
}

export async function fetchAdultSearch(
  query: string,
  page = 1,
  type = "west",
  source?: string,
  genre?: string,
): Promise<GodenListEnvelope<GodenListItem>> {
  const qs = new URLSearchParams({ q: query, page: String(page), subcategory: "adult", type });
  setSource(qs, source);
  if (genre && genre !== "all") qs.set("genre", genre);
  return apiFetch<GodenListEnvelope<GodenListItem>>(
    `/api/v1/entertainment/search?${qs}`,
  );
}

export async function fetchAdultGenres(
  type = "west",
  source?: string,
): Promise<GodenListEnvelope<string>> {
  const qs = new URLSearchParams({ subcategory: "adult", type });
  setSource(qs, source);
  return apiFetch<GodenListEnvelope<string>>(`/api/v1/entertainment/genres?${qs}`);
}

export async function fetchAdultDetail(
  videoId: string,
  type = "west",
  source?: string,
): Promise<GodenEnvelope<import("@/types").AdultDetail>> {
  const qs = new URLSearchParams({ subcategory: "adult", type });
  setSource(qs, source);
  return apiFetch<GodenEnvelope<import("@/types").AdultDetail>>(
    `/api/v1/entertainment/${encodeURIComponent(videoId)}?${qs}`,
  );
}

export async function fetchAdultSources(
  slug: string,
  type = "west",
  source?: string,
): Promise<GodenEnvelope<GodenSource[]>> {
  const qs = new URLSearchParams({ subcategory: "adult", type });
  setSource(qs, source);
  const response = await apiFetch<GodenEnvelope<Array<{ url: string; quality?: string; label?: string }>>>(
    `/api/v1/entertainment/${encodeURIComponent(slug)}/sources?${qs}`,
  );
  return {
    ...response,
    data: normalizeSources(response.data, "mp4"),
  };
}

// ─── Entertainment ────────────────────────────────────────────────
// Backend /api/v1/entertainment/* — subcategory: movie, adult, semi

export async function fetchEntertainmentLatest(
  page = 1,
  subcategory = "movie",
  genre?: string,
  source?: string,
): Promise<GodenListEnvelope<GodenListItem>> {
  const qs = new URLSearchParams({ page: String(page), subcategory });
  if (genre && genre !== "all") qs.set("genre", genre);
  setSource(qs, source);
  return apiFetch<GodenListEnvelope<GodenListItem>>(
    `/api/v1/entertainment/latest?${qs}`,
  );
}

export async function fetchEntertainmentPopular(
  page = 1,
  subcategory = "movie",
  genre?: string,
  source?: string,
): Promise<GodenListEnvelope<GodenListItem>> {
  const qs = new URLSearchParams({ page: String(page), subcategory });
  if (genre && genre !== "all") qs.set("genre", genre);
  setSource(qs, source);
  return apiFetch<GodenListEnvelope<GodenListItem>>(
    `/api/v1/entertainment/popular?${qs}`,
  );
}

export async function fetchEntertainmentSearch(
  query: string,
  page = 1,
  subcategory = "movie",
  source?: string,
): Promise<GodenListEnvelope<GodenListItem>> {
  const qs = new URLSearchParams({ q: query, page: String(page), subcategory });
  setSource(qs, source);
  return apiFetch<GodenListEnvelope<GodenListItem>>(
    `/api/v1/entertainment/search?${qs}`,
  );
}

export async function fetchEntertainmentGenres(
  subcategory = "movie",
): Promise<GodenListEnvelope<string>> {
  const qs = new URLSearchParams({ subcategory });
  return apiFetch<GodenListEnvelope<string>>(`/api/v1/entertainment/genres?${qs}`);
}

export async function fetchEntertainmentDetail(
  slug: string,
  subcategory = "movie",
  source?: string,
): Promise<GodenEnvelope<import("@/types").EntertainmentDetail>> {
  const qs = new URLSearchParams({ subcategory });
  setSource(qs, source);
  return apiFetch<GodenEnvelope<import("@/types").EntertainmentDetail>>(
    `/api/v1/entertainment/${encodeURIComponent(slug)}?${qs}`,
  );
}

export async function fetchEntertainmentSources(
  slug: string,
  subcategory = "movie",
  source?: string,
): Promise<GodenEnvelope<{ title?: string; slug?: string; sources: GodenSource[]; source?: string }>> {
  const qs = new URLSearchParams({ subcategory });
  setSource(qs, source);
  const response = await apiFetch<GodenEnvelope<{ title?: string; slug?: string; sources?: GodenSource[]; source?: string }>>(
    `/api/v1/entertainment/${encodeURIComponent(slug)}/sources?${qs}`,
  );
  return {
    ...response,
    data: {
      ...response.data,
      sources: normalizeSources(response.data.sources ?? []),
    },
  };
}

// ─── Vault ────────────────────────────────────────────────────────
// Backend /api/v1/vault/* — cached content with signed stream URLs

export async function fetchVaultResolve(
  opts: { code?: string; title?: string; kind?: "video" | "comic" | "image"; category?: string; slug?: string; ttl?: number },
): Promise<import("@/types").VaultResolveResponse> {
  const qs = new URLSearchParams();
  if (opts.code) qs.set("code", opts.code);
  if (opts.title) qs.set("title", opts.title);
  if (opts.kind) qs.set("kind", opts.kind);
  if (opts.category) qs.set("category", opts.category);
  if (opts.slug) qs.set("slug", opts.slug);
  if (opts.ttl) qs.set("ttl", String(opts.ttl));
  return apiFetch<import("@/types").VaultResolveResponse>(
    `/api/v1/vault/resolve?${qs}`,
  );
}

// ─── Auth (user-facing, Bearer JWT) ──────────────────────────────

export async function fetchAuthMe(token: string): Promise<AuthUser> {
  return userFetch<AuthUser>("/api/v1/auth/me", token);
}

/** Google OAuth login — redirect the browser to this URL.
 *  Points directly at the upstream so the 307 → Google redirect runs in
 *  the browser, not server-side inside the Next proxy fetch(). */
export function getGoogleLoginUrl(returnTo?: string): string {
  const upstream = process.env.NEXT_PUBLIC_API_BASE || "https://api.godenpg.dev";
  const target = returnTo
    ? returnTo
    : typeof window !== "undefined"
      ? `${window.location.origin}/auth/callback`
      : "";
  if (!target) return `${upstream}/api/v1/auth/google/login`;
  const qs = new URLSearchParams({ return_to: target });
  return `${upstream}/api/v1/auth/google/login?${qs}`;
}

// ─── InfiniteGrid adapter ─────────────────────────────────────────
// Convert api.godenpg.dev GodenListEnvelope to the PaginatedResponse shape
// that InfiniteGrid expects. HasMore is derived from data.length > 0
// because the backend only reports items-on-page, not total in DB.

export function toPaginated<T>(
  envelope: GodenListEnvelope<T>,
  page: number,
): PaginatedResponse<T> {
  const count = envelope.data.length;
  const perPage = Math.max(count, 20);
  // The backend reports items-on-page, not a total. Prefer an explicit
  // has_next_page flag when present; otherwise assume a full page means
  // there's likely another. A short/empty page is treated as the last one,
  // which avoids the wasted round-trip of fetching an empty page+1.
  const hasMore = envelope.meta?.has_next_page ?? count >= perPage;
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
