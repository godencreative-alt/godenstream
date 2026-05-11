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
const DEFAULT_API_KEY = process.env.API_KEY;

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

const SHORDRAMA_ID_KEYS = [
  "id",
  "bookId",
  "book_id",
  "drama_id",
  "dramaId",
  "dcup",
  "dlit",
  "dshame",
  "shortplay_id",
  "seriesId",
  "programId",
  "playId",
  "compilationsId",
  "fakeId",
  "slug",
  "hash",
];

const SHORDRAMA_TITLE_KEYS = [
  "title",
  "bookName",
  "book_name",
  "book_title",
  "short_play_name",
  "drama_title",
  "nseri",
  "nmeasu",
  "nsin",
  "seriesName",
  "playName",
  "shortPlayName",
  "bannerName",
  "name",
];

const SHORDRAMA_COVER_KEYS = [
  "cover_url",
  "compress_cover_url",
  "coverWap",
  "cover",
  "coverUrl",
  "coverHoriUrl",
  "cover_image",
  "poster",
  "posterSmall",
  "book_pic",
  "first_chapter_cover",
  "thumb_url",
  "drama_cover",
  "drama_cover_h",
  "ptear",
  "first_frame",
  "fileUrl",
  "seriesPosterFileUrl",
  "picUrl",
  "horizontalCoverId",
  "bannerImage",
  "thumbnail",
  "thumbnailExpanded",
  "titleImage",
  "icon",
  "img",
  "images",
  "pday",
  "pbat",
  "fdar",
];

const SHORDRAMA_COUNT_KEYS = [
  "chapter_count",
  "chapterCount",
  "episode_count",
  "episodeCount",
  "episodesCount",
  "totalEpisodes",
  "totalChapters",
  "serial_count",
  "current_count",
  "last_chapter_index",
  "chapters",
  "episodes",
  "total",
  "ewood",
  "ewin",
  "eshe",
  "uploadOfEpisodes",
];

const SHORDRAMA_DESCRIPTION_KEYS = [
  "introduction",
  "description",
  "abstract",
  "desc",
  "recommendIntro",
  "special_desc",
  "summary",
  "synopsis",
  "logLine",
  "playDesc",
  "dwill",
  "ddet",
  "dentra",
];

const SHORDRAMA_PLAY_COUNT_KEYS = [
  "playCount",
  "view_count",
  "read_count",
  "viewCount",
  "watchCount",
  "watch_count",
  "collectNum",
  "collect_count",
  "fav_count",
  "favorite_count",
  "clickNum",
];

function firstStringFromRecord(source: Record<string, unknown>, keys: string[]): string | undefined {
  const direct = pickString(source, keys);
  if (direct) return direct;

  for (const key of keys) {
    const value = source[key];
    if (isRecord(value)) {
      const nested = pickString(value, ["url", "thumb", "src", "image", "web_image", "thumbnail", "cover"]);
      if (nested) return nested;
    }
  }
}

function firstStringFromArrays(
  source: Record<string, unknown>,
  arrayKeys: string[],
  valueKeys: string[],
): string | undefined {
  for (const arrayKey of arrayKeys) {
    for (const item of toArray(source[arrayKey])) {
      const value = pickString(item, valueKeys);
      if (value) return value;
    }
  }
}

function shordramaRecordScore(item: Record<string, unknown>): number {
  const nested = primaryShordramaRecord(item, false);
  const record = nested === item ? item : nested;
  let score = 0;
  if (firstShordramaId(record)) score += 2;
  if (pickString(record, SHORDRAMA_TITLE_KEYS)) score += 3;
  if (firstShordramaCover(record)) score += 3;
  if (pickNumber(record, SHORDRAMA_COUNT_KEYS) !== undefined) score += 1;
  if (pickString(record, SHORDRAMA_DESCRIPTION_KEYS)) score += 1;
  return score;
}

function primaryShordramaRecord(
  item: Record<string, unknown>,
  includeSelf = true,
): Record<string, unknown> {
  const candidates = [
    item.program,
    item.drama,
    item.book,
    item.series,
    item.play,
    item.shortPlay,
    item.detail,
    item.item,
  ].filter(isRecord);

  const bestNested = candidates
    .map((candidate) => ({ candidate, score: shordramaRecordScoreWithoutNesting(candidate) }))
    .sort((a, b) => b.score - a.score)[0];

  if (!includeSelf) return bestNested?.candidate || item;

  const selfScore = shordramaRecordScoreWithoutNesting(item);
  return bestNested && bestNested.score > selfScore ? bestNested.candidate : item;
}

function shordramaRecordScoreWithoutNesting(item: Record<string, unknown>): number {
  let score = 0;
  if (firstShordramaId(item)) score += 2;
  if (pickString(item, SHORDRAMA_TITLE_KEYS)) score += 3;
  if (firstShordramaCover(item)) score += 3;
  if (pickNumber(item, SHORDRAMA_COUNT_KEYS) !== undefined) score += 1;
  if (pickString(item, SHORDRAMA_DESCRIPTION_KEYS)) score += 1;
  return score;
}

function firstShordramaId(item: Record<string, unknown>): string | undefined {
  const value =
    pickString(item, SHORDRAMA_ID_KEYS) ||
    (pickNumber(item, SHORDRAMA_ID_KEYS) !== undefined
      ? String(pickNumber(item, SHORDRAMA_ID_KEYS))
      : undefined);
  return value?.trim() ? value : undefined;
}

function firstShordramaCover(item: Record<string, unknown>): string | undefined {
  const cover =
    firstStringFromRecord(item, SHORDRAMA_COVER_KEYS) ||
    firstStringFromArrays(item, ["thumbnails", "images", "posters"], ["url", "thumb", "src"]) ||
    undefined;
  return normalizeShordramaImageUrl(cover);
}

function normalizeShordramaImageUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  if (url.includes("sign") && url.includes(".heic")) return url;
  if (url.includes("~tplv-") && url.endsWith(".heic")) {
    return `${url.slice(0, -".heic".length)}.jpeg`;
  }
  if (url.includes("~tplv-") && url.includes(".heic?")) {
    return url.replace(".heic?", ".jpeg?");
  }
  return url;
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

export function getShordramaHref(
  drama: Pick<Drama, "id" | "original_id" | "provider_slug">,
): string {
  return shordramaHref(drama);
}

function mapShordramaItem(
  item: Record<string, unknown>,
  provider: ShordramaPlatform,
): Drama {
  const source = primaryShordramaRecord(item);
  const id = firstShordramaId(source) || firstShordramaId(item) || "";
  const numericId = id.trim() ? Number(id) : Number.NaN;
  const title =
    pickString(source, SHORDRAMA_TITLE_KEYS) ||
    pickString(item, SHORDRAMA_TITLE_KEYS) ||
    "Untitled";
  const cover = firstShordramaCover(source) || firstShordramaCover(item) || null;

  return {
    id: Number.isNaN(numericId)
      ? Math.abs(hashId(`${provider.slug}:${id || title}`))
      : numericId,
    original_id: id || undefined,
    title,
    cover_url: cover,
    provider_id: provider.id,
    provider_name: provider.name,
    provider_slug: provider.slug,
    chapter_count: pickNumber(source, SHORDRAMA_COUNT_KEYS) ?? null,
    play_count: pickNumber(source, SHORDRAMA_PLAY_COUNT_KEYS) ?? 0,
    introduction: pickString(source, SHORDRAMA_DESCRIPTION_KEYS) || null,
    language: pickString(source, ["lang", "language", "lweek", "lgain", "lhomew", "display_language"]) || null,
    is_dubbed:
      Boolean(source.is_dubbed) ||
      String(source.cover_tag ?? source.title ?? source.book_title ?? "").toLowerCase().includes("dub"),
    raw_data: null,
  };
}

function shordramaHref(drama: Pick<Drama, "id" | "original_id" | "provider_slug">): string {
  return `/shordrama/${drama.provider_slug}/${encodeURIComponent(
    drama.original_id || String(drama.id),
  )}`;
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
  const directKeys = [
    "rows",
    "dramas",
    "short_plays",
    "books",
    "list",
    "items",
    "results",
    "series",
    "videos",
    "playlets",
    "recommendations",
    "payloads",
    "plays",
    "dramaResponseList",
    "shortPlayResponseList",
    "lconne",
    "lint",
    "lsumm",
  ];

  for (const key of directKeys) {
    const value = toArray(data[key]);
    if (value.length > 0) return value;
  }

  if (isRecord(data.data)) {
    const nestedKeys = [
      ...directKeys,
      "data",
      "rankList",
      "searchList",
      "homeList",
      "records",
      "contents",
      "payloads",
      "banner",
      "eclim",
    ];
    for (const key of nestedKeys) {
      const value = toArray(data.data[key]);
      if (value.length > 0) return value;
    }
    const sections = toArray(data.data.sections).flatMap((section) =>
      toArray(section.books).concat(toArray(section.list), toArray(section.items)),
    );
    if (sections.length > 0) return sections;
    const playSections = toArray(data.data).flatMap((section) => toArray(section.plays));
    if (playSections.length > 0) return playSections;
  }

  const dataArray = toArray(data.data);
  if (dataArray.length > 0) {
    const plays = dataArray.flatMap((section) => toArray(section.plays));
    if (plays.length > 0) return plays;
    return dataArray;
  }
  return collectShordramaRecords(data).slice(0, 80);
}

function collectShordramaRecords(value: unknown, depth = 0): Record<string, unknown>[] {
  if (depth > 6) return [];
  if (Array.isArray(value)) {
    const records = value.filter((item): item is Record<string, unknown> => isRecord(item));
    if (records.length > 0 && records.some((item) => shordramaRecordScore(item) >= 5)) {
      return records.filter((item) => shordramaRecordScore(item) >= 4);
    }
    return records.flatMap((item) => collectShordramaRecords(item, depth + 1));
  }
  if (!isRecord(value)) return [];
  return Object.values(value).flatMap((item) => collectShordramaRecords(item, depth + 1));
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
    latestPath: () => "/api/home?lang=in",
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
    slug: "dramanova",
    name: "DramaNova",
    apiBase: "/dramanova",
    language: "in",
    latestPath: (page: number, perPage: number) =>
      `/api/v1/dramas?lang=in&page=${page}&size=${perPage}`,
    popularPath: (page: number, perPage: number) =>
      `/api/v1/recommend?lang=in&categoryKey=dramanova_hot&page=${page}&size=${perPage}&limit=${perPage}`,
    trendingPath: (page: number, perPage: number) =>
      `/api/v1/recommend?lang=in&categoryKey=dramanova_hot&page=${page}&size=${perPage}&limit=${perPage}`,
    extract: extractDataBooks,
  },
  {
    id: 6,
    slug: "bilitv",
    name: "BiliTV",
    apiBase: "/bilitv",
    language: "id",
    latestPath: (page: number, perPage: number) =>
      `/api/v1/dramas?page=${page}&limit=${perPage}&lang=id`,
    popularPath: (page: number, perPage: number) =>
      `/api/v1/recommend?page=${page}&limit=${perPage}&lang=id`,
    trendingPath: (page: number, perPage: number) =>
      `/api/v1/home?page=${page}&limit=${perPage}&lang=id`,
    extract: extractDataBooks,
  },
  {
    id: 7,
    slug: "cashdrama",
    name: "CashDrama",
    apiBase: "/cashdrama",
    language: "id",
    latestPath: (page: number, perPage: number) =>
      `/api/v1/home?page=${page}&pageSize=${perPage}&lang=id`,
    popularPath: (page: number, perPage: number) =>
      `/api/v1/blocks?page=${page}&pageSize=${perPage}&blockId=5&lang=id`,
    trendingPath: (page: number, perPage: number) =>
      `/api/v1/home?page=${page}&pageSize=${perPage}&lang=id`,
    extract: extractDataBooks,
  },
  {
    id: 8,
    slug: "cubetv",
    name: "CubeTV",
    apiBase: "/cubetv",
    language: "id",
    latestPath: () => "/home/shows?lang=id",
    popularPath: () => "/home/recommendations?lang=id",
    trendingPath: () => "/home/trending?lang=id",
    extract: extractDataBooks,
  },
  {
    id: 9,
    slug: "dotdrama",
    name: "DotDrama",
    apiBase: "/dotdrama",
    language: "id",
    latestPath: (page: number, perPage: number) =>
      `/api/v1/dramas?page=${page}&limit=${perPage}&lang=id`,
    popularPath: (page: number, perPage: number) =>
      `/api/v1/collections?page=${page}&limit=${perPage}&lang=id`,
    trendingPath: (page: number, perPage: number) =>
      `/api/v1/dramas?page=${page}&limit=${perPage}&lang=id`,
    extract: extractDataBooks,
  },
  {
    id: 10,
    slug: "dramabite",
    name: "DramaBite",
    apiBase: "/dramabite",
    language: "id",
    latestPath: (page: number) => `/api/v1/dramas?page=${page}&lang=id`,
    popularPath: (page: number) => `/api/v1/foryou?page=${page}&lang=id`,
    trendingPath: (page: number) => `/api/v1/hot?page=${page}&lang=id`,
    extract: extractDataBooks,
  },
  {
    id: 11,
    slug: "dramadash",
    name: "DramaDash",
    apiBase: "/dramadash",
    language: "id",
    latestPath: (page: number) => `/api/v1/tabs/15?page=${page}`,
    popularPath: (page: number) => `/api/v1/tabs/15?page=${page}`,
    trendingPath: (page: number) => `/api/v1/tabs/15?page=${page}`,
    extract: extractDataBooks,
  },
  {
    id: 12,
    slug: "dramapops",
    name: "DramaPops",
    apiBase: "/dramapops",
    language: "id",
    latestPath: (_page: number, perPage: number) =>
      `/api/v1/dramas?limit=${perPage}&lang=id`,
    popularPath: (_page: number, perPage: number) =>
      `/api/v1/dramas/popular?limit=${perPage}&lang=id`,
    trendingPath: (_page: number, perPage: number) =>
      `/api/v1/dramas/trending?limit=${perPage}&lang=id`,
    extract: extractDataBooks,
  },
  {
    id: 13,
    slug: "dramarush",
    name: "DramaRush",
    apiBase: "/dramarush",
    language: "id",
    latestPath: (page: number) => `/api/v1/tabs/0?page=${page}&lang=id`,
    popularPath: () => "/api/v1/ranking?lang=id",
    trendingPath: () => "/api/v1/ranking?lang=id",
    extract: extractDataBooks,
  },
  {
    id: 14,
    slug: "dramawave",
    name: "DramaWave",
    apiBase: "/dramawave",
    language: "id-ID",
    latestPath: (page: number) => `/api/v1/feed/new?page=${page}&lang=id-ID`,
    popularPath: (page: number) => `/api/v1/feed/popular?page=${page}&lang=id-ID`,
    trendingPath: (page: number) => `/api/v1/feed/popular?page=${page}&lang=id-ID`,
    extract: extractDataBooks,
  },
  {
    id: 15,
    slug: "flextv",
    name: "FlexTV",
    apiBase: "/flextv",
    language: "id",
    latestPath: (page: number) => `/api/v1/tabs/1?page=${page}&lang=id`,
    popularPath: (page: number) => `/api/v1/tabs/1?page=${page}&lang=id`,
    trendingPath: (page: number) => `/api/v1/tabs/1?page=${page}&lang=id`,
    extract: extractDataBooks,
  },
  {
    id: 16,
    slug: "flickreels",
    name: "FlickReels",
    apiBase: "/flickreels",
    language: "id",
    latestPath: (page: number) => `/api/v1/for-you?page=${page}&lang=id`,
    popularPath: (page: number) => `/api/v1/hot-rank?page=${page}&lang=id`,
    trendingPath: (page: number) => `/api/v1/hot-rank?page=${page}&lang=id`,
    extract: extractDataBooks,
  },
  {
    id: 17,
    slug: "flickshort",
    name: "FlickShort",
    apiBase: "/flickshort",
    language: "id",
    latestPath: (_page: number, perPage: number) =>
      `/api/v1/home?limit=${perPage}&lang=id`,
    popularPath: (_page: number, perPage: number) =>
      `/api/v1/recommend?limit=${perPage}&lang=id`,
    trendingPath: (_page: number, perPage: number) =>
      `/api/v1/recommend?limit=${perPage}&lang=id`,
    extract: extractDataBooks,
  },
  {
    id: 18,
    slug: "freereels",
    name: "FreeReels",
    apiBase: "/freereels",
    language: "id-ID",
    latestPath: (page: number) => `/api/v1/new?page=${page - 1}&lang=id-ID`,
    popularPath: (page: number) => `/api/v1/popular?page=${page - 1}&lang=id-ID`,
    trendingPath: (page: number) => `/api/v1/foryou?page=${page - 1}&lang=id-ID`,
    extract: extractDataBooks,
  },
  {
    id: 19,
    slug: "fundrama",
    name: "Fundrama",
    apiBase: "/fundrama",
    language: "id",
    latestPath: (page: number, perPage: number) =>
      `/api/v1/dramas?page=${page}&limit=${perPage}&lang=id`,
    popularPath: (page: number, perPage: number) =>
      `/api/v1/dramas?page=${page}&limit=${perPage}&lang=id`,
    trendingPath: (page: number, perPage: number) =>
      `/api/v1/dramas?page=${page}&limit=${perPage}&lang=id`,
    extract: extractDataBooks,
  },
  {
    id: 20,
    slug: "goodshort",
    name: "GoodShort",
    apiBase: "/goodshort",
    language: "id",
    latestPath: (page: number, perPage: number) =>
      `/api/v1/home?channelId=562&page=${page}&pageSize=${perPage}`,
    popularPath: (page: number, perPage: number) =>
      `/api/v1/home?channelId=562&page=${page}&pageSize=${perPage}`,
    trendingPath: (page: number, perPage: number) =>
      `/api/v1/home?channelId=562&page=${page}&pageSize=${perPage}`,
    extract: extractDataBooks,
  },
  {
    id: 21,
    slug: "hishort",
    name: "HiShort",
    apiBase: "/hishort",
    language: "id",
    latestPath: () => "/api/v1/home",
    popularPath: () => "/api/v1/home",
    trendingPath: () => "/api/v1/home",
    extract: extractDataBooks,
  },
  {
    id: 22,
    slug: "meloshort",
    name: "MeloShort",
    apiBase: "/meloshort",
    language: "id",
    latestPath: (page: number, perPage: number) =>
      `/api/v1/drama/all?page=${page}&limit=${perPage}&lang=id`,
    popularPath: (page: number, perPage: number) =>
      `/api/v1/dramas/top?page=${page}&limit=${perPage}&lang=id`,
    trendingPath: (page: number, perPage: number) =>
      `/api/v1/dramas/discover?page=${page}&limit=${perPage}&lang=id`,
    extract: extractDataBooks,
  },
  {
    id: 23,
    slug: "microdrama",
    name: "MicroDrama",
    apiBase: "/microdrama",
    language: "id",
    latestPath: (_page: number, perPage: number) =>
      `/api/v1/dramas?limit=${perPage}&lang=id`,
    popularPath: (_page: number, perPage: number) =>
      `/api/v1/dramas?limit=${perPage}&lang=id`,
    trendingPath: (_page: number, perPage: number) =>
      `/api/v1/dramas?limit=${perPage}&lang=id`,
    extract: extractDataBooks,
  },
  {
    id: 24,
    slug: "minutedrama",
    name: "MinuteDrama",
    apiBase: "/minutedrama",
    language: "id",
    latestPath: (page: number, perPage: number) =>
      `/api/v1/popular?page=${page}&size=${perPage}`,
    popularPath: (page: number, perPage: number) =>
      `/api/v1/popular?page=${page}&size=${perPage}`,
    trendingPath: (page: number, perPage: number) =>
      `/api/v1/popular?page=${page}&size=${perPage}`,
    extract: extractDataBooks,
  },
  {
    id: 25,
    slug: "moboreels",
    name: "MoboReels",
    apiBase: "/moboreels",
    language: "id",
    latestPath: () =>
      "/api/channelDetail?schemaId=94874897842045252&channelId=162979468352028714&skipSeries=0&langId=11",
    popularPath: () =>
      "/api/channelDetail?schemaId=94874897842045252&channelId=162979468352028714&skipSeries=0&langId=11",
    trendingPath: () =>
      "/api/channelDetail?schemaId=94874897842045252&channelId=162979468352028714&skipSeries=0&langId=11",
    extract: extractDataBooks,
  },
  {
    id: 26,
    slug: "radreels",
    name: "RadReels",
    apiBase: "/radreels",
    language: "en",
    latestPath: (page: number, perPage: number) =>
      `/api/v1/home?page=${page}&size=${perPage}&lang=en`,
    popularPath: () => "/api/v1/ranking?lang=en",
    trendingPath: (page: number, perPage: number) =>
      `/api/v1/foryou?page=${page}&size=${perPage}&lang=en`,
    extract: extractDataBooks,
  },
  {
    id: 27,
    slug: "rapidtv",
    name: "RapidTV",
    apiBase: "/rapidtv",
    language: "in",
    latestPath: (page: number, perPage: number) =>
      `/api/v1/dramas?page=${page}&size=${perPage}&lang=in`,
    popularPath: (page: number, perPage: number) =>
      `/api/v1/dramas?page=${page}&size=${perPage}&lang=in`,
    trendingPath: (page: number, perPage: number) =>
      `/api/v1/dramas?page=${page}&size=${perPage}&lang=in`,
    extract: extractDataBooks,
  },
  {
    id: 28,
    slug: "reelala",
    name: "Reelala",
    apiBase: "/reelala",
    language: "id",
    latestPath: (page: number, perPage: number) =>
      `/api/home?page=${page}&pageSize=${perPage}&lang=id`,
    popularPath: (page: number, perPage: number) =>
      `/api/for-you?page=${page}&pageSize=${perPage}&lang=id`,
    trendingPath: (page: number, perPage: number) =>
      `/api/for-you?page=${page}&pageSize=${perPage}&lang=id`,
    extract: extractDataBooks,
  },
  {
    id: 29,
    slug: "reelife",
    name: "Reelife",
    apiBase: "/reelife",
    language: "id",
    latestPath: (page: number, perPage: number) =>
      `/api/v1/dramas?page=${page}&size=${perPage}`,
    popularPath: () => "/api/v1/ranking",
    trendingPath: (page: number, perPage: number) =>
      `/api/v1/foryou?page=${page}&size=${perPage}`,
    extract: extractDataBooks,
  },
  {
    id: 30,
    slug: "reelshort",
    name: "ReelShort",
    apiBase: "/reelshort",
    language: "in",
    latestPath: () => "/api/v1/new?lang=in",
    popularPath: () => "/api/v1/foryou?lang=in",
    trendingPath: () => "/api/v1/foryou?lang=in",
    extract: extractDataBooks,
  },
  {
    id: 31,
    slug: "sarostv",
    name: "SarosTV",
    apiBase: "/sarostv",
    language: "en_US",
    latestPath: () => "/api/theater?lang=en_US",
    popularPath: () => "/api/recommend?lang=en_US",
    trendingPath: () => "/api/theater?lang=en_US",
    extract: extractDataBooks,
  },
  {
    id: 32,
    slug: "shortbox",
    name: "ShortBox",
    apiBase: "/shortbox",
    language: "en",
    latestPath: (page: number, perPage: number) =>
      `/api/new-list?page=${page}&page_size=${perPage}&languages=en`,
    popularPath: (page: number, perPage: number) =>
      `/api/list?page=${page}&page_size=${perPage}&sort_type=1&languages=en`,
    trendingPath: (page: number, perPage: number) =>
      `/api/list?page=${page}&page_size=${perPage}&sort_type=1&languages=en`,
    extract: extractDataBooks,
  },
  {
    id: 33,
    slug: "shorten",
    name: "Shorten",
    apiBase: "/shorten",
    language: "id",
    latestPath: (page: number, perPage: number) => `/api/v1/releases?page=${page}&perPage=${perPage}`,
    popularPath: (page: number, perPage: number) => `/api/v1/editors?page=${page}&perPage=${perPage}`,
    trendingPath: (page: number, perPage: number) => `/api/v1/exclusive?page=${page}&perPage=${perPage}`,
    extract: extractDataBooks,
  },
  {
    id: 34,
    slug: "shortmax",
    name: "ShortMax",
    apiBase: "/shortmax",
    language: "id",
    latestPath: () => "/api/v1/feed/new?lang=id",
    popularPath: () => "/api/v1/feed/recommend?lang=id",
    trendingPath: () => "/api/v1/foryou?lang=id",
    extract: extractDataBooks,
  },
  {
    id: 35,
    slug: "shortsky",
    name: "ShortSky",
    apiBase: "/shortsky",
    language: "id_id",
    latestPath: () => "/api/home?lang=id_id",
    popularPath: () => "/api/recommend?lang=id_id",
    trendingPath: () => "/api/recommend?lang=id_id",
    extract: extractDataBooks,
  },
  {
    id: 36,
    slug: "shortwave",
    name: "ShortWave",
    apiBase: "/shortwave",
    language: "in",
    latestPath: () => "/api/all?lang=in",
    popularPath: () => "/api/top?lang=in",
    trendingPath: () => "/api/rankings?lang=in",
    extract: extractDataBooks,
  },
  {
    id: 37,
    slug: "shotshort",
    name: "ShotShort",
    apiBase: "/shotshort",
    language: "id",
    latestPath: (page: number, perPage: number) =>
      `/api/popular?page=${page}&limit=${perPage}&lang=id`,
    popularPath: (page: number, perPage: number) =>
      `/api/popular?page=${page}&limit=${perPage}&lang=id`,
    trendingPath: (page: number, perPage: number) =>
      `/api/popular?page=${page}&limit=${perPage}&lang=id`,
    extract: extractDataBooks,
  },
  {
    id: 38,
    slug: "snackshort",
    name: "SnackShort",
    apiBase: "/snackshort",
    language: "Indonesian",
    latestPath: () => "/api/v1/home?lang=Indonesian",
    popularPath: (page: number, perPage: number) =>
      `/api/v1/browsing?page=${page}&pageSize=${perPage}&lang=Indonesian`,
    trendingPath: () => "/api/v1/tabs?lang=Indonesian",
    extract: extractDataBooks,
  },
  {
    id: 39,
    slug: "sodareels",
    name: "SodaReels",
    apiBase: "/sodareels",
    language: "id",
    latestPath: (page: number, perPage: number) =>
      `/api/v1/home?page=${page}&count=${perPage}&lang=id`,
    popularPath: (page: number, perPage: number) =>
      `/api/v1/home?page=${page}&count=${perPage}&lang=id`,
    trendingPath: (page: number, perPage: number) =>
      `/api/v1/home?page=${page}&count=${perPage}&lang=id`,
    extract: extractDataBooks,
  },
  {
    id: 40,
    slug: "stardusttv",
    name: "StardustTV",
    apiBase: "/stardusttv",
    language: "th",
    latestPath: (_page: number, perPage: number) =>
      `/api/v1/homepage?page_size=${perPage}&lang=th`,
    popularPath: (page: number, perPage: number) =>
      `/api/v1/category/1?page=${page}&page_size=${perPage}&lang=th`,
    trendingPath: (_page: number, perPage: number) =>
      `/api/v1/homepage?page_size=${perPage}&lang=th`,
    extract: extractDataBooks,
  },
  {
    id: 41,
    slug: "starshort",
    name: "StarShort",
    apiBase: "/starshort",
    language: "4",
    latestPath: () => "/api/v1/dramas/new?lang=4",
    popularPath: () => "/api/v1/dramas?lang=4",
    trendingPath: () => "/api/v1/dramas?lang=4",
    extract: extractDataBooks,
  },
  {
    id: 42,
    slug: "velolo",
    name: "Velolo",
    apiBase: "/velolo",
    language: "id",
    latestPath: (page: number, perPage: number) =>
      `/new?page=${page}&limit=${perPage}&lang=id`,
    popularPath: (page: number, perPage: number) =>
      `/hot?page=${page}&limit=${perPage}&lang=id`,
    trendingPath: (page: number, perPage: number) =>
      `/hot?page=${page}&limit=${perPage}&lang=id`,
    extract: extractDataBooks,
  },
  {
    id: 43,
    slug: "vigloo",
    name: "Vigloo",
    apiBase: "/vigloo",
    language: "en",
    latestPath: (_page: number, perPage: number) =>
      `/api/v1/browse?offset=0&limit=${perPage}&lang=en`,
    popularPath: (_page: number, perPage: number) =>
      `/api/v1/browse?sort=POPULAR&limit=${perPage}&lang=en`,
    trendingPath: (_page: number, perPage: number) =>
      `/api/v1/rank?limit=${perPage}&lang=en`,
    extract: extractDataBooks,
  },
] as const;

export type ShordramaPlatform = (typeof SHORDRAMA_PLATFORMS)[number];
export type ShordramaPlatformSlug = ShordramaPlatform["slug"];
export type ShordramaSort = "trending" | "popular" | "latest";

export interface ShordramaDetail extends DramaDetail {
  platform_slug: ShordramaPlatformSlug;
}

export interface ShordramaVideo {
  episode: Episode | null;
  qualities: Record<string, string> | null;
  video_url: string | null;
  subtitle_url: string | null;
  subtitles: { lang: string; url: string }[] | null;
}

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
    .filter((item) => shordramaRecordScore(item) >= 4)
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
  const perPlatform = Math.max(1, Math.ceil(perPage / SHORDRAMA_PLATFORMS.length));
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
  const maxLength = Math.max(0, ...sections.map((section) => section.data.length));
  const data: Drama[] = [];
  for (let index = 0; index < maxLength && data.length < perPage; index++) {
    for (const section of sections) {
      const drama = section.data[index];
      if (!drama) continue;
      data.push(drama);
      if (data.length >= perPage) break;
    }
  }
  return { data, meta: shordramaMeta(page, perPage) };
}

export async function fetchShordramaSearch(
  query: string,
  perPage = 30,
): Promise<PaginatedResponse<Drama>> {
  const q = query.trim().toLowerCase();
  if (q.length < 2) {
    return { data: [], meta: shordramaMeta(1, perPage, 0) };
  }

  const sections = await Promise.all(
    SHORDRAMA_PLATFORMS.map((platform) =>
      fetchShordramaPlatformList({
        platform: platform.slug,
        sort: "latest",
        page: 1,
        per_page: 50,
      }).catch(() => ({ data: [], meta: shordramaMeta(1, 50, 0) })),
    ),
  );
  const seen = new Set<string>();
  const data = sections
    .flatMap((section) => section.data)
    .filter((drama) => {
      const haystack = [
        drama.title,
        drama.provider_name,
        drama.introduction,
        drama.language,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const key = `${drama.provider_slug}:${drama.id}`;
      if (seen.has(key) || !haystack.includes(q)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, perPage);

  return { data, meta: shordramaMeta(1, perPage, data.length) };
}

function createEpisode(
  source: {
    sourceId?: string;
    dramaId: string;
    episode: number;
    name?: string | null;
    videoUrl?: string | null;
    qualities?: Record<string, string> | null;
    subtitleUrl?: string | null;
    subtitles?: { lang: string; url: string }[] | null;
    status?: string;
    locked?: boolean;
    coverUrl?: string | null;
    duration?: number | null;
  },
): Episode {
  return {
    id: Math.abs(hashId(`${source.dramaId}:${source.sourceId || source.episode}`)),
    drama_id: Math.abs(hashId(source.dramaId)),
    source_id: source.sourceId,
    episode_index: source.episode,
    episode_name: source.name || `Episode ${source.episode}`,
    video_url: source.videoUrl || null,
    subtitle_url: source.subtitleUrl || null,
    subtitles: source.subtitles || null,
    qualities: source.qualities || null,
    status: source.status || (source.locked ? "locked" : "published"),
    locked: source.locked,
    cover_url: source.coverUrl || null,
    duration_seconds: source.duration ?? null,
  };
}

function qualityMapFromList(items: Record<string, unknown>[]): Record<string, string> | null {
  const qualities: Record<string, string> = {};
  items.forEach((item) => {
    const url =
      pickString(item, [
        "play_url",
        "url",
        "main_url",
        "backup_url",
        "videoPath",
        "mp4",
        "m3u8Url",
        "MainPlayUrl",
        "BackupPlayUrl",
        "videoUrl",
        "backupUrl",
        "mediaUrl",
        "stream_url",
        "Mopp",
        "Bcold",
        "Mcurr",
        "Bdesi",
      ]) ||
      null;
    if (!url) return;
    const label =
      pickString(item, ["definition", "Definition", "quality", "Quality", "Dbag", "Dcoura", "resolution"]) ||
      (pickNumber(item, ["quality", "height", "Height", "resolution", "Wroll", "Wspare"])
        ? `${pickNumber(item, ["quality", "height", "Height", "resolution", "Wroll", "Wspare"])}p`
        : null) ||
      `Q${Object.keys(qualities).length + 1}`;
    qualities[label] = url;
  });
  return Object.keys(qualities).length > 0 ? qualities : null;
}

function subtitleList(items: Record<string, unknown>[]): { lang: string; url: string }[] | null {
  const subtitles = items
    .map((item) => {
      const url = pickString(item, ["url", "subtitle_url", "file", "textTrackUrl"]);
      if (!url) return null;
      return {
        lang: pickString(item, ["lang", "language", "label"]) || "Subtitle",
        url,
      };
    })
    .filter(Boolean) as { lang: string; url: string }[];
  return subtitles.length > 0 ? subtitles : null;
}

function objectQualityMap(value: unknown): Record<string, string> | null {
  if (!isRecord(value)) return null;
  if (Object.values(value).some(isRecord)) {
    return qualityMapFromList(Object.values(value).filter(isRecord));
  }
  const qualities: Record<string, string> = {};
  Object.entries(value).forEach(([key, raw]) => {
    if (typeof raw !== "string" || !raw) return;
    const label = key.replace(/^video_/, "").replace(/^q_/, "");
    qualities[label.match(/^\d+$/) ? `${label}p` : label] = raw;
  });
  return Object.keys(qualities).length > 0 ? qualities : null;
}

function normalizeRelativeVideoUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("//")) return `https:${url}`;
  if (url.startsWith("http://")) return `https://${url.slice("http://".length)}`;
  if (url.startsWith("/v1/play/")) return `https://api.shortswave.com${url}`;
  return url;
}

function detailFromParts(
  platform: ShordramaPlatform,
  dramaId: string,
  item: Record<string, unknown>,
  episodes: Episode[],
  tags?: Tag[],
): ShordramaDetail {
  const base = mapShordramaItem(item, platform);
  return {
    ...base,
    id: Number.isNaN(Number(dramaId)) ? base.id : Number(dramaId),
    original_id: dramaId,
    provider_id: platform.id,
    provider_name: platform.name,
    provider_slug: platform.slug,
    platform_slug: platform.slug,
    chapter_count: episodes.length || base.chapter_count,
    episode_count: episodes.length || base.chapter_count || 0,
    episodes,
    tags,
  };
}

function extractDetailRecord(
  data: unknown,
  platform: ShordramaPlatform,
  dramaId: string,
): Record<string, unknown> | null {
  const payload = isRecord(data) && isRecord(data.data) ? data.data : data;
  if (!isRecord(payload)) return null;

  const candidates = [
    payload,
    payload.drama,
    payload.detail,
    payload.book,
    payload.series,
    payload.show,
    payload.item,
    payload.tvInfo,
    payload.bswitc,
    payload.btra,
    payload.jieguo,
  ].filter(isRecord);

  if (isRecord(payload.data)) candidates.push(payload.data);
  if (isRecord(payload.dgiv)) {
    candidates.push(...[payload.dgiv.bswitc, payload.dgiv].filter(isRecord));
  }
  if (isRecord(payload.dinsur)) {
    candidates.push(...[payload.dinsur.jieguo, payload.dinsur].filter(isRecord));
    candidates.push(...toArray(payload.dinsur.erefu));
  }
  if (isRecord(payload.ddriv)) {
    candidates.push(...[payload.ddriv.btra, payload.ddriv].filter(isRecord));
  }
  if (isRecord(data) && isRecord(data.dataResult)) {
    candidates.push(...[data.dataResult.tvInfo, data.dataResult].filter(isRecord));
  }
  candidates.push(...collectShordramaRecords(data));

  const extracted = platform.extract(data);
  candidates.push(...extracted);

  return (
    candidates.find((item) => {
      const id = firstShordramaId(item);
      return id === dramaId;
    }) ||
    candidates
      .filter((item) => shordramaRecordScore(item) > 0)
      .sort((a, b) => shordramaRecordScore(b) - shordramaRecordScore(a))[0] ||
    null
  );
}

function extractGenericEpisodes(
  detail: Record<string, unknown>,
  dramaId: string,
): Episode[] {
  const sources = [
    detail.episodes,
    detail.episode_list,
    detail.episodeList,
    detail.chapter_list,
    detail.chapterList,
    detail.chapters,
    detail.videos,
    detail.video_list,
    detail.videoList,
    detail.list,
    detail.chapters,
    detail.ebeer,
    detail.eclim,
    detail.ppoem,
    detail.funi,
    detail.ffile,
    detail.dramaResponseList,
    detail.payloads,
  ];

  for (const source of sources) {
    const records = toArray(source);
    if (records.length === 0) continue;
    return records.map((episode, index) => {
      const order =
        pickNumber(episode, [
          "episode_index",
          "episodeIndex",
          "episodeNo",
          "episode",
          "episodeNum",
          "episodeNumber",
          "number",
          "serial_number",
          "chapter_index",
          "chapterOrder",
        ]) ??
        (pickNumber(episode, ["index", "chapterIndex", "sort"]) ?? index) + 1;
      return createEpisode({
        dramaId,
        sourceId:
          pickString(episode, [
            "id",
            "episode_id",
            "episodeId",
            "chapterId",
            "chapter_id",
            "fileId",
            "vid",
            "videoFakeId",
            "id",
            "dshame",
            "dcup",
            "dlit",
            "ewash",
            "Fwea",
            "Fcaree",
          ]) || String(order),
        episode: order,
        name: pickString(episode, [
          "title",
          "name",
          "episode_name",
          "episodeName",
          "chapter_name",
          "chapterName",
          "ptitl",
        ]),
        videoUrl: pickString(episode, [
          "play_url",
          "video_url",
          "url",
          "main_url",
          "mp4",
          "m3u8Url",
          "stream_url",
          "signPlayUrl",
          "signPlayUrlH264",
          "mediaUrl",
          "Mopp",
          "Bcold",
          "Mcurr",
          "Bdesi",
        ]),
        qualities:
          qualityMapFromList(toArray(episode.play_info_list)) ||
          qualityMapFromList(toArray(episode.playInfoList)) ||
          qualityMapFromList(toArray(episode.videos)) ||
          qualityMapFromList(toArray(episode.videoPathList)) ||
          qualityMapFromList(toArray(episode.episMedia)) ||
          objectQualityMap(episode.videoUrl) ||
          objectQualityMap(episode.m3u8s),
        subtitles: subtitleList(toArray(episode.subtitles)) || subtitleList(toArray(episode.sublist)),
        coverUrl: pickString(episode, [
          "cover",
          "cover_url",
          "episode_cover",
          "video_pic",
          "first_frame",
          "coverImgUrl",
          "frameExtractionCover",
          "coverId",
        ]),
        duration: pickNumber(episode, ["duration", "duration_seconds", "chapter_duration", "Dissue", "Dcol"]),
        locked: Boolean(
          episode.locked ||
            episode.isLocked ||
            episode.is_vip ||
            episode.isVip ||
            episode.is_paid ||
            episode.isPaid ||
            episode.need_unlock ||
            episode.needUnlock ||
            episode.is_lock ||
            episode.lock,
        ),
      });
    });
  }

  return [];
}

function placeholderEpisodes(
  detail: Record<string, unknown>,
  dramaId: string,
): Episode[] {
  const count =
    pickNumber(detail, [
      "chapter_count",
      "chapterCount",
      "episode_count",
      "episodeCount",
      "totalEpisodes",
      "serial_count",
      "current_count",
      "last_chapter_index",
    ]) || 0;
  const safeCount = Math.max(0, Math.min(count, 300));
  return Array.from({ length: safeCount }, (_, index) =>
    createEpisode({
      dramaId,
      sourceId: pickString(detail, ["chapter_id", "chapterId", "first_chapter_id"]),
      episode: index + 1,
      videoUrl: index === 0 ? pickString(detail, ["play_url", "stream_url", "video_url"]) : null,
      qualities:
        index === 0
          ? qualityMapFromList(toArray(detail.funi)) ||
            qualityMapFromList(toArray(detail.ffile)) ||
            qualityMapFromList(toArray(detail.ppoem)) ||
            objectQualityMap(detail.videoUrl) ||
            objectQualityMap(detail.m3u8s)
          : null,
      subtitles: index === 0 ? subtitleList(toArray(detail.sublist)) || subtitleList(toArray(detail.subtitles)) : null,
      coverUrl: pickString(detail, ["first_frame", "cover", "cover_url", "video_pic"]),
      duration: pickNumber(detail, ["chapter_duration", "duration", "Dissue", "Dcol"]),
    }),
  );
}

async function fetchGenericShordramaDetail(
  platform: ShordramaPlatform,
  dramaId: string,
): Promise<ShordramaDetail> {
  const encodedId = encodeURIComponent(dramaId);
  const language = encodeURIComponent(platform.language);
  const paths = [
    `/api/v1/detail/${encodedId}?lang=${language}`,
    `/api/v1/drama/${encodedId}?lang=${language}`,
    `/api/v1/dramas/${encodedId}?lang=${language}`,
    `/api/v1/book/${encodedId}?lang=${language}`,
    `/api/v1/book/${encodedId}/chapters?lang=${language}`,
    `/api/v1/dramas/${encodedId}/episodes?limit=300&lang=${language}`,
    `/api/v1/series?id=${encodedId}&lang=${language}`,
    `/api/detail/${encodedId}?lang=${language}`,
    `/api/book/${encodedId}?lang=${language}`,
    `/api/book/${encodedId}/episodes?lang=${language}`,
    `/api/drama/${encodedId}?lang=${language}`,
    `/api/drama/${encodedId}?languages=${language}`,
    `/api/detail/${encodedId}?languages=${language}`,
    `/api/episodes/${encodedId}?index=1&count=300&languages=${language}`,
    `/api/v1/play/${encodedId}?page=1&size=300&lang=${language}`,
    `/api/v1/drama/${encodedId}/episodes?lang=${language}`,
    `/api/v1/drama/${encodedId}/episodes?limit=300&lang=${language}`,
  ];

  for (const path of paths) {
    try {
      const res = await apiFetch<unknown>(`${platform.apiBase}${path}`);
      const detail = extractDetailRecord(res, platform, dramaId);
      if (!detail) continue;
      const episodes = extractGenericEpisodes(detail, dramaId);
      return detailFromParts(
        platform,
        dramaId,
        detail,
        episodes.length > 0 ? episodes : placeholderEpisodes(detail, dramaId),
      );
    } catch {
      continue;
    }
  }

  const seed = (await findShordramaListItem(platform.slug, dramaId)) || { id: dramaId };
  return detailFromParts(
    platform,
    dramaId,
    seed,
    placeholderEpisodes(seed, dramaId),
  );
}

function extractTags(items: Record<string, unknown>[]): Tag[] {
  return items
    .map((item, index) => {
      const name = pickString(item, ["tag_local", "tagName", "name", "label"]);
      if (!name) return null;
      return {
        id: pickNumber(item, ["id", "tagId"]) || index + 1,
        name,
      };
    })
    .filter(Boolean) as Tag[];
}

async function fetchIdramaDetail(
  platform: ShordramaPlatform,
  dramaId: string,
): Promise<ShordramaDetail> {
  const detail = await apiFetch<Record<string, unknown>>(
    `${platform.apiBase}/api/v1/drama/${encodeURIComponent(dramaId)}?lang=${platform.language}`,
  );
  const episodes = toArray(detail.episode_list).map((episode, index) => {
    const order = pickNumber(episode, ["episode_order"]) || index + 1;
    const qualities = qualityMapFromList(toArray(episode.play_info_list));
    return createEpisode({
      dramaId,
      sourceId: String(pickNumber(episode, ["episode_id"]) || order),
      episode: order,
      videoUrl: pickString(episode, ["play_url"]),
      qualities,
      coverUrl: pickString(episode, ["episode_cover"]),
      locked: Boolean(episode.is_vip),
    });
  });
  return detailFromParts(
    platform,
    dramaId,
    detail,
    episodes,
    extractTags(toArray(detail.content_tag)),
  );
}

async function fetchDramaboxDetail(
  platform: ShordramaPlatform,
  dramaId: string,
): Promise<ShordramaDetail> {
  const chapterData = await apiFetch<Record<string, unknown>>(
    `${platform.apiBase}/api/drama/${encodeURIComponent(dramaId)}?lang=${platform.language}`,
  );
  const nested = isRecord(chapterData.data) && isRecord(chapterData.data.data)
    ? chapterData.data.data
    : chapterData;
  const episodes = toArray(nested.list).map((episode, index) => {
    const chapterIndex = pickNumber(episode, ["chapterIndex"]) ?? index;
    const sourceId =
      pickString(episode, ["chapterId"]) ||
      String(pickNumber(episode, ["chapterId"]) || chapterIndex + 1);
    return createEpisode({
      dramaId,
      sourceId,
      episode: chapterIndex + 1,
      name: `Episode ${chapterIndex + 1}`,
      locked: Boolean(pickNumber(episode, ["isPay", "isCharge"])),
      qualities: qualityMapFromList(toArray(episode.chapterSizeVoList)),
    });
  });
  const seed = await findShordramaListItem(platform.slug, dramaId);
  return detailFromParts(platform, dramaId, seed || { id: dramaId }, episodes);
}

async function fetchMeloloDetail(
  platform: ShordramaPlatform,
  dramaId: string,
): Promise<ShordramaDetail> {
  const detail = await apiFetch<Record<string, unknown>>(
    `${platform.apiBase}/api/v1/series?id=${encodeURIComponent(dramaId)}&lang=${platform.language}`,
  );
  const series = isRecord(detail.series) ? detail.series : {};
  const explicitEpisodes = toArray(detail.episodes).map((episode, index) =>
    createEpisode({
      dramaId,
      sourceId: pickString(episode, ["vid"]) || String(pickNumber(episode, ["vid"]) || index + 1),
      episode: pickNumber(episode, ["index"]) || index + 1,
      coverUrl: pickString(episode, ["cover"]),
      locked: Boolean(episode.need_unlock || episode.needUnlock || episode.is_paid || episode.isPaid),
      duration: pickNumber(episode, ["duration"]),
    }),
  );
  const episodes =
    explicitEpisodes.length > 0
      ? explicitEpisodes
      : Array.from({ length: pickNumber(series, ["episode_count"]) ?? 0 }, (_, index) =>
          createEpisode({
            dramaId,
            sourceId:
              index === 0
                ? pickString(series, ["first_chapter_item_id"]) || `${dramaId}:${index + 1}`
                : `${dramaId}:${index + 1}`,
            episode: index + 1,
          }),
        );
  return detailFromParts(
    platform,
    dramaId,
    {
      id: dramaId,
      title: pickString(series, ["title"]),
      introduction: pickString(series, ["intro"]),
      cover: pickString(series, ["cover"]),
      totalEpisodes: pickNumber(series, ["episode_count"]),
      playCount: pickNumber(series, ["play_count"]),
    },
    episodes,
  );
}

async function fetchNetshortDetail(
  platform: ShordramaPlatform,
  dramaId: string,
): Promise<ShordramaDetail> {
  const res = await apiFetch<Record<string, unknown>>(
    `${platform.apiBase}/api/v1/detail/${encodeURIComponent(dramaId)}?lang=${platform.language}`,
  );
  const detail = isRecord(res.data) ? res.data : res;
  const episodes = toArray(detail.episodes).map((episode, index) =>
    createEpisode({
      dramaId,
      sourceId: pickString(episode, ["episodeId"]) || String(index + 1),
      episode: pickNumber(episode, ["episodeNo"]) || index + 1,
      coverUrl: pickString(episode, ["cover"]),
      locked: Boolean(episode.isLocked),
    }),
  );
  const tags = Array.isArray(detail.labels)
    ? detail.labels
        .filter((label): label is string => typeof label === "string")
        .map((label, index) => ({ id: index + 1, name: label }))
    : undefined;
  return detailFromParts(platform, dramaId, detail, episodes, tags);
}

async function fetchDramanovaDetail(
  platform: ShordramaPlatform,
  dramaId: string,
): Promise<ShordramaDetail> {
  const detail = await apiFetch<Record<string, unknown>>(
    `${platform.apiBase}/api/v1/drama/${encodeURIComponent(dramaId)}?lang=${platform.language}`,
  );
  const episodes = toArray(detail.episodes).map((episode, index) =>
    createEpisode({
      dramaId,
      sourceId: pickString(episode, ["fileId", "id"]) || String(index + 1),
      episode: pickNumber(episode, ["number"]) || index + 1,
      name: pickString(episode, ["title"]),
      coverUrl: pickString(episode, ["cover"]),
      qualities: qualityMapFromList(toArray(episode.videos)),
      subtitles: subtitleList(toArray(episode.subtitles)),
      locked: episode.free === false,
    }),
  );
  return detailFromParts(platform, dramaId, detail, episodes);
}

async function findShordramaListItem(
  platformSlug: ShordramaPlatformSlug,
  dramaId: string,
): Promise<Record<string, unknown> | null> {
  const platform = getShordramaPlatform(platformSlug);
  if (!platform) return null;
  for (const sort of ["latest", "popular", "trending"] as ShordramaSort[]) {
    try {
      const path =
        sort === "latest"
          ? platform.latestPath(1, 50)
          : sort === "popular"
            ? platform.popularPath(1, 50)
            : platform.trendingPath(1, 50);
      const res = await apiFetch<unknown>(`${platform.apiBase}${path}`);
      const match = platform.extract(res).find((item) => {
        const id =
          pickString(item, ["id", "bookId", "book_id"]) ||
          String(pickNumber(item, ["id", "bookId", "book_id"]) ?? "");
        return id === dramaId;
      });
      if (match) return match;
    } catch {
      continue;
    }
  }
  return null;
}

export async function fetchShordramaDetail(
  platformSlug: string,
  dramaId: string,
): Promise<ShordramaDetail> {
  const platform = getShordramaPlatform(platformSlug);
  if (!platform) throw new Error("Platform tidak ditemukan");
  if (platform.slug === "drama-id") return fetchIdramaDetail(platform, dramaId);
  if (platform.slug === "dramabox") return fetchDramaboxDetail(platform, dramaId);
  if (platform.slug === "melolo") return fetchMeloloDetail(platform, dramaId);
  if (platform.slug === "netshort") return fetchNetshortDetail(platform, dramaId);
  if (platform.slug === "dramanova") return fetchDramanovaDetail(platform, dramaId);
  return fetchGenericShordramaDetail(platform, dramaId);
}

export async function fetchShordramaEpisodes(
  platformSlug: string,
  dramaId: string,
): Promise<PaginatedResponse<Episode>> {
  const detail = await fetchShordramaDetail(platformSlug, dramaId);
  const episodes = detail.episodes || [];
  return { data: episodes, meta: shordramaMeta(1, episodes.length || 1, episodes.length) };
}

function normalizeVideoResponse(
  dramaId: string,
  episode: Episode,
  res: unknown,
): ShordramaVideo {
  const payload = isRecord(res) && isRecord(res.data) ? res.data : res;
  const record = isRecord(payload)
    ? primaryShordramaRecord(
        isRecord(payload.payload) ? payload.payload : isRecord(payload.jieguo) ? payload.jieguo : payload,
      )
    : {};
  const videos = toArray(record.videos);
  const qualities =
    qualityMapFromList(videos) ||
    qualityMapFromList(toArray(record.videoPathList)) ||
    qualityMapFromList(toArray(record.play_info_list)) ||
    qualityMapFromList(toArray(record.playInfoList)) ||
    qualityMapFromList(toArray(record.qualities)) ||
    qualityMapFromList(toArray(record.episMedia)) ||
    objectQualityMap(isRecord(record.parsed) ? record.parsed.videos : undefined) ||
    objectQualityMap(record.videoUrl) ||
    objectQualityMap(record.m3u8s) ||
    episode.qualities;
  const subtitles = subtitleList(toArray(record.subtitles)) || episode.subtitles;
  const videoUrl =
    pickString(record, [
      "play_url",
      "video_url",
      "url",
      "main_url",
      "mp4",
      "m3u8Url",
      "stream_url",
      "mediaUrl",
      "signPlayUrl",
      "signPlayUrlH264",
      "Mopp",
      "Bcold",
      "Mcurr",
      "Bdesi",
    ]) ||
    (isRecord(record.parsed) ? pickString(record.parsed, ["main_url", "url", "video_url"]) : null) ||
    (qualities ? Object.values(qualities)[0] : null) ||
    episode.video_url;
  return {
    episode: {
      ...episode,
      id: Math.abs(hashId(`${dramaId}:${episode.source_id || episode.episode_index}:video`)),
      video_url: normalizeRelativeVideoUrl(videoUrl),
      qualities,
      subtitles,
      subtitle_url: subtitles?.[0]?.url || episode.subtitle_url,
    },
    qualities,
    video_url: normalizeRelativeVideoUrl(videoUrl),
    subtitle_url: subtitles?.[0]?.url || episode.subtitle_url,
    subtitles,
  };
}

export async function fetchShordramaVideo(
  platformSlug: string,
  dramaId: string,
  episodeIndex: number,
): Promise<ShordramaVideo> {
  const platform = getShordramaPlatform(platformSlug);
  if (!platform) throw new Error("Platform tidak ditemukan");
  const detail = await fetchShordramaDetail(platformSlug, dramaId);
  const episode = detail.episodes?.find((item) => item.episode_index === episodeIndex) || null;
  if (!episode) {
    return {
      episode: null,
      qualities: null,
      video_url: null,
      subtitle_url: null,
      subtitles: null,
    };
  }

  if (platform.slug === "drama-id") {
    const res = await apiFetch<Record<string, unknown>>(
      `${platform.apiBase}/api/v1/unlock/${encodeURIComponent(dramaId)}/${episodeIndex}/${episodeIndex}`,
      { method: "POST" },
    );
    const unlocked = toArray(res.episodes)[0];
    const data = unlocked && isRecord(unlocked.data) ? unlocked.data : unlocked;
    return normalizeVideoResponse(dramaId, episode, data || episode);
  }

  if (platform.slug === "netshort") {
    const res = await apiFetch<unknown>(
      `${platform.apiBase}/api/v1/episode/${encodeURIComponent(dramaId)}/${episodeIndex}?lang=${platform.language}`,
    );
    return normalizeVideoResponse(dramaId, episode, res);
  }

  if (platform.slug === "dramanova") {
    const sourceId = episode.source_id;
    if (!sourceId) return normalizeVideoResponse(dramaId, episode, episode);
    const res = await apiFetch<unknown>(
      `${platform.apiBase}/api/video?id=${encodeURIComponent(sourceId)}`,
    );
    return normalizeVideoResponse(dramaId, episode, res);
  }

  if (platform.slug === "melolo" && episode.source_id && !episode.source_id.includes(":")) {
    const res = await apiFetch<unknown>(
      `${platform.apiBase}/api/v1/video?id=${encodeURIComponent(episode.source_id)}&lang=${platform.language}`,
    );
    return normalizeVideoResponse(dramaId, episode, res);
  }

  if (episode.video_url || episode.qualities) {
    return normalizeVideoResponse(dramaId, episode, episode);
  }

  const sourceId = episode.source_id ? encodeURIComponent(episode.source_id) : "";
  const encodedId = encodeURIComponent(dramaId);
  const language = encodeURIComponent(platform.language);
  const videoPaths = [
    `/api/v1/dramas/${encodedId}/episodes/${sourceId}?lang=${language}`,
    `/api/v1/videos/${encodedId}?source=${sourceId || "1001"}`,
    `/api/book/${encodedId}/chapter/${sourceId}?lang=${language}`,
    `/api/drama/${encodedId}/episode/${episodeIndex}?lang=${language}`,
    `/api/v1/drama/${encodedId}/episode/${episodeIndex}/video?lang=${language}&quality=720p`,
    `/api/v1/drama/${encodedId}/episode/${episodeIndex}?lang=${language}&quality=720P`,
    `/api/v1/book/${encodedId}/chapter/${sourceId}/video?lang=${language}`,
    `/api/stream/${encodedId}/${sourceId}?lang=${language}`,
    `/api/stream/${encodedId}/${episodeIndex}?quality=high&languages=${language}`,
    `/api/v1/play/${encodedId}/${episodeIndex}?lang=${language}`,
    `/api/v1/video/${sourceId}/${encodedId}?lang=${language}`,
    `/api/video?seriesId=${encodedId}&episNum=${episodeIndex}&langId=11`,
  ].filter((path) => !path.includes("//?") && !path.includes("/undefined"));

  for (const path of videoPaths) {
    try {
      const res = await apiFetch<unknown>(`${platform.apiBase}${path}`);
      const video = normalizeVideoResponse(dramaId, episode, res);
      if (video.video_url || video.qualities) return video;
    } catch {
      continue;
    }
  }

  return normalizeVideoResponse(dramaId, episode, episode);
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
