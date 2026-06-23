import type {
  GodenListEnvelope,
  GodenEnvelope,
  GodenListItem,
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
  if (!IS_BROWSER && path.startsWith("/v1/") && !path.startsWith("/v1/auth")) {
    if (GODEN_API_KEY) headers["X-API-Key"] = GODEN_API_KEY;
  }

  // Server-side: enable Next.js request memoization to deduplicate
  // identical fetches within the same render (e.g., generateMetadata + page)
  const fetchOptions: RequestInit = {
    ...init,
    headers,
    ...(IS_BROWSER ? {} : { next: { revalidate: false } }),
  };

  const res = await fetch(url, fetchOptions);
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

/** Decode a backend asset base64 URL to its original URL.
 *  Returns null if the URL is not an asset path or decode fails. */
export function decodeAssetBase64(url: string): string | null {
  const m = url.match(/^\/api\/v1\/asset\/([A-Za-z0-9+/_-]+=*)$/);
  if (!m) return null;
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
  return null;
}

/** Rewrite a backend asset path to the best reachable URL.
 *  For video files (.mp4, .m3u8, .webm), decode the base64 and use the original
 *  URL directly — this avoids proxying large files through Next.js.
 *  For images/thumbnails, route through the proxy for caching + API key injection. */
export function proxyAssetUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("/v1/asset/")) {
    // Try to decode the base64 to check if it's a video file
    const decoded = decodeAssetBase64(url);
    if (decoded) {
      // Video files: use direct URL to avoid proxying large files
      if (/\.(mp4|m3u8|webm)(\?|\/|$)/i.test(decoded)) return decoded;
    }
    // Images/thumbnails: route through proxy for caching
    return `/api/proxy${url}`;
  }
  if (url.startsWith("/v1/")) return `/api/proxy${url}`;
  return url;
}

/** For iframe embeds (dailymotion, blogger, etc.), the backend's
 *  /v1/asset/<base64> wrapper is counterproductive: many embed hosts
 *  reject server-side fetches (502) but render fine when the browser
 *  loads them directly. So for type=embed we decode the base64 and use
 *  the original URL. Falls back to the proxy path on decode failure. */
function unwrapAssetUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const decoded = decodeAssetBase64(url);
  if (decoded) return decoded;
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

// ─── Anime ────────────────────────────────────────────────────────

export async function fetchAnimeLatest(
  page = 1,
  opts?: { genre?: string; subcategory?: string },
): Promise<GodenListEnvelope<GodenListItem>> {
  const qs = new URLSearchParams({ page: String(page) });
  if (opts?.genre && opts.genre !== "all") qs.set("genre", opts.genre);
  if (opts?.subcategory) qs.set("subcategory", opts.subcategory);
  return apiFetch<GodenListEnvelope<GodenListItem>>(
    `/v1/anime/latest?${qs}`,
  );
}

export async function fetchAnimePopular(
  page = 1,
  opts?: { subcategory?: string },
): Promise<GodenListEnvelope<GodenListItem>> {
  const qs = new URLSearchParams({ page: String(page) });
  if (opts?.subcategory) qs.set("subcategory", opts.subcategory);
  return apiFetch<GodenListEnvelope<GodenListItem>>(
    `/v1/anime/popular?${qs}`,
  );
}

export async function fetchAnimeGenres(): Promise<GodenListEnvelope<string>> {
  return apiFetch<GodenListEnvelope<string>>(`/v1/anime/genres`);
}

export async function fetchAnimeSearch(
  query: string,
  page = 1,
  genre?: string,
): Promise<GodenListEnvelope<GodenListItem>> {
  const qs = new URLSearchParams({ q: query, page: String(page) });
  if (genre && genre !== "all") qs.set("genre", genre);
  return apiFetch<GodenListEnvelope<GodenListItem>>(
    `/v1/anime/search?${qs}`,
  );
}

export async function fetchAnimeDetail(
  slug: string,
): Promise<GodenEnvelope<AnimeDetail>> {
  return apiFetch<GodenEnvelope<AnimeDetail>>(
    `/v1/anime/${encodeURIComponent(slug)}`,
  );
}

export async function fetchAnimeEpisodes(
  slug: string,
): Promise<GodenEnvelope<GodenEpisode[]>> {
  return apiFetch<GodenEnvelope<GodenEpisode[]>>(
    `/v1/anime/${encodeURIComponent(slug)}/episodes`,
  );
}

export async function fetchAnimeEpisodeSources(
  episodeSlug: string,
): Promise<GodenEnvelope<AnimeSourcesData>> {
  return apiFetch<GodenEnvelope<AnimeSourcesData>>(
    `/v1/anime/episode/${encodeURIComponent(episodeSlug)}/sources`,
  );
}

export async function fetchAnimeEpisodeDownloads(
  episodeSlug: string,
): Promise<GodenEnvelope<AnimeDownloadData>> {
  return apiFetch<GodenEnvelope<AnimeDownloadData>>(
    `/v1/anime/episode/${encodeURIComponent(episodeSlug)}/download`,
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
    `/v1/entertainment/latest?${qs}`,
  );
}

export async function fetchMoviePopular(
  page = 1,
  source?: string,
): Promise<GodenListEnvelope<GodenListItem>> {
  const qs = new URLSearchParams({ page: String(page), subcategory: "movie" });
  setSource(qs, source);
  return apiFetch<GodenListEnvelope<GodenListItem>>(
    `/v1/entertainment/popular?${qs}`,
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
    `/v1/entertainment/search?${qs}`,
  );
}

export async function fetchMovieGenres(): Promise<GodenListEnvelope<string>> {
  return apiFetch<GodenListEnvelope<string>>(`/v1/entertainment/genres?subcategory=movie`);
}

export async function fetchMovieDetail(
  slug: string,
  source?: string,
): Promise<GodenEnvelope<MovieDetail>> {
  const qs = new URLSearchParams({ subcategory: "movie" });
  setSource(qs, source);
  const suffix = qs.size ? `?${qs}` : "?subcategory=movie";
  return apiFetch<GodenEnvelope<MovieDetail>>(
    `/v1/entertainment/${encodeURIComponent(slug)}${suffix}`,
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
    `/v1/entertainment/${encodeURIComponent(slug)}/sources${suffix}`,
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
  if (opts?.type) qs.set("subcategory", opts.type);
  if (opts?.genre && opts.genre !== "all") qs.set("genre", opts.genre);
  setSource(qs, opts?.source ?? "auto");
  return apiFetch<GodenListEnvelope<GodenListItem>>(
    `/v1/comic/latest?${qs}`,
  );
}

export async function fetchComicPopular(
  page = 1,
  opts?: { source?: string; type?: string; genre?: string },
): Promise<GodenListEnvelope<GodenListItem>> {
  const qs = new URLSearchParams({ page: String(page) });
  if (opts?.type) qs.set("subcategory", opts.type);
  if (opts?.genre && opts.genre !== "all") qs.set("genre", opts.genre);
  setSource(qs, opts?.source ?? "auto");
  return apiFetch<GodenListEnvelope<GodenListItem>>(
    `/v1/comic/popular?${qs}`,
  );
}

export async function fetchComicGenres(
  opts?: { source?: string; type?: string },
): Promise<GodenListEnvelope<string>> {
  const qs = new URLSearchParams();
  if (opts?.type) qs.set("subcategory", opts.type);
  setSource(qs, opts?.source ?? "auto");
  const suffix = qs.size ? `?${qs}` : "";
  return apiFetch<GodenListEnvelope<string>>(`/v1/comic/genres${suffix}`);
}

export async function fetchComicSearch(
  query: string,
  page = 1,
  opts?: { source?: string; type?: string; genre?: string },
): Promise<GodenListEnvelope<GodenListItem>> {
  const qs = new URLSearchParams({ q: query, page: String(page) });
  if (opts?.type) qs.set("subcategory", opts.type);
  if (opts?.genre && opts.genre !== "all") qs.set("genre", opts.genre);
  setSource(qs, opts?.source ?? "auto");
  return apiFetch<GodenListEnvelope<GodenListItem>>(
    `/v1/comic/search?${qs}`,
  );
}

export async function fetchComicChapters(
  slug: string,
  opts?: { source?: string; type?: string },
): Promise<GodenEnvelope<GodenEpisode[]>> {
  const qs = new URLSearchParams();
  if (opts?.type) qs.set("subcategory", opts.type);
  setSource(qs, opts?.source ?? "auto");
  const suffix = qs.size ? `?${qs}` : "";
  return apiFetch<GodenEnvelope<GodenEpisode[]>>(
    `/v1/comic/${encodeURIComponent(slug)}/chapters${suffix}`,
  );
}

export async function fetchComicDetail(
  slug: string,
  opts?: { source?: string; type?: string },
): Promise<GodenEnvelope<import("@/types").ComicDetail>> {
  const qs = new URLSearchParams();
  if (opts?.type) qs.set("subcategory", opts.type);
  setSource(qs, opts?.source ?? "auto");
  const suffix = qs.size ? `?${qs}` : "";
  const detail = await apiFetch<GodenEnvelope<import("@/types").ComicDetail>>(
    `/v1/comic/${encodeURIComponent(slug)}${suffix}`,
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
  if (opts?.type) qs.set("subcategory", opts.type);
  setSource(qs, opts?.source ?? "auto");
  const suffix = qs.size ? `?${qs}` : "";
  return apiFetch<GodenEnvelope<string[]>>(
    `/v1/comic/chapter/${encodeURIComponent(chapterSlug)}/images${suffix}`,
  );
}

// ─── Comic Library (731 Drive titles) ──────────────────────────────

export async function fetchComicLibrary(
  subcategory?: string,
  page = 1,
  limit = 24,
): Promise<GodenListEnvelope<GodenListItem>> {
  const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (subcategory && subcategory !== "all") qs.set("subcategory", subcategory);
  return apiFetch<GodenListEnvelope<GodenListItem>>(
    `/v1/comic/library?${qs}`,
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
    `/v1/donghua/latest?${qs}`,
  );
}

export async function fetchDonghuaPopular(
  page = 1,
): Promise<GodenListEnvelope<GodenListItem>> {
  // Backend popular endpoint hardcodes anichin and ignores `source`, so
  // don't bother sending it. (latest/search/detail still use it.)
  return apiFetch<GodenListEnvelope<GodenListItem>>(
    `/v1/donghua/popular?page=${page}`,
  );
}

export async function fetchDonghuaGenres(): Promise<GodenListEnvelope<string>> {
  return apiFetch<GodenListEnvelope<string>>(`/v1/donghua/genres`);
}

export async function fetchDonghuaSearch(
  query: string,
  page = 1,
  source = "anichin",
): Promise<GodenListEnvelope<GodenListItem>> {
  const qs = new URLSearchParams({ q: query, page: String(page) });
  setSource(qs, source);
  return apiFetch<GodenListEnvelope<GodenListItem>>(
    `/v1/donghua/search?${qs}`,
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
    `/v1/donghua/${encodeURIComponent(slug)}${suffix}`,
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
    `/v1/donghua/${encodeURIComponent(slug)}/episodes${suffix}`,
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
    `/v1/donghua/episode/${encodeURIComponent(episodeSlug)}${suffix}`,
  );
}

// ─── Entertainment ────────────────────────────────────────────────
// Backend /v1/entertainment/* — subcategory: movie, tv-series, adult

export async function fetchEntertainmentLatest(
  page = 1,
  subcategory = "movie",
  genre?: string,
  source?: string,
  type?: string,
): Promise<GodenListEnvelope<GodenListItem>> {
  const qs = new URLSearchParams({ page: String(page), subcategory });
  if (genre && genre !== "all") qs.set("genre", genre);
  if (type) qs.set("type", type);
  setSource(qs, source);
  return apiFetch<GodenListEnvelope<GodenListItem>>(
    `/v1/entertainment/latest?${qs}`,
  );
}

export async function fetchEntertainmentPopular(
  page = 1,
  subcategory = "movie",
  genre?: string,
  source?: string,
  type?: string,
): Promise<GodenListEnvelope<GodenListItem>> {
  const qs = new URLSearchParams({ page: String(page), subcategory });
  if (genre && genre !== "all") qs.set("genre", genre);
  if (type) qs.set("type", type);
  setSource(qs, source);
  return apiFetch<GodenListEnvelope<GodenListItem>>(
    `/v1/entertainment/popular?${qs}`,
  );
}

export async function fetchEntertainmentSearch(
  query: string,
  page = 1,
  subcategory = "movie",
  source?: string,
  type?: string,
): Promise<GodenListEnvelope<GodenListItem>> {
  const qs = new URLSearchParams({ q: query, page: String(page), subcategory });
  if (type) qs.set("type", type);
  setSource(qs, source);
  return apiFetch<GodenListEnvelope<GodenListItem>>(
    `/v1/entertainment/search?${qs}`,
  );
}

export async function fetchEntertainmentGenres(
  subcategory = "movie",
): Promise<GodenListEnvelope<string>> {
  const qs = new URLSearchParams({ subcategory });
  return apiFetch<GodenListEnvelope<string>>(`/v1/entertainment/genres?${qs}`);
}

export async function fetchEntertainmentDetail(
  slug: string,
  subcategory = "movie",
  type?: string,
): Promise<GodenEnvelope<import("@/types").EntertainmentDetail>> {
  const qs = new URLSearchParams({ subcategory });
  if (type && subcategory === "adult") qs.set("type", type);
  return apiFetch<GodenEnvelope<import("@/types").EntertainmentDetail>>(
    `/v1/entertainment/${encodeURIComponent(slug)}?${qs}`,
  );
}

export async function fetchEntertainmentSources(
  slug: string,
  subcategory = "movie",
  type?: string,
): Promise<GodenEnvelope<{ title?: string; slug?: string; sources: GodenSource[]; source?: string }>> {
  const qs = new URLSearchParams({ subcategory });
  if (type && subcategory === "adult") qs.set("type", type);
  // Backend returns sources as either { data: [...sources] } or { data: { sources: [...] } }
  const response = await apiFetch<any>(
    `/v1/entertainment/${encodeURIComponent(slug)}/sources?${qs}`,
  );
  const rawData = response.data;
  const sourcesArray: any[] = Array.isArray(rawData)
    ? rawData
    : (rawData?.sources ?? []);
  return {
    ...response,
    data: {
      ...(typeof rawData === "object" && !Array.isArray(rawData) ? rawData : {}),
      sources: normalizeSources(sourcesArray),
    },
  };
}

// ─── Vault ────────────────────────────────────────────────────────
// Backend /v1/vault/* — cached content with signed stream URLs

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
    `/v1/vault/resolve?${qs}`,
  );
}

// ─── Auth (user-facing, Bearer JWT) ──────────────────────────────

export async function fetchAuthMe(token: string): Promise<AuthUser> {
  return userFetch<AuthUser>("/v1/auth/me", token);
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
  if (!target) return `${upstream}/v1/auth/google/login`;
  const qs = new URLSearchParams({ return_to: target });
  return `${upstream}/v1/auth/google/login?${qs}`;
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
