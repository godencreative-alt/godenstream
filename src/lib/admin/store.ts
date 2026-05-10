import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "crypto";
import { mkdir, readFile, rename, stat, unlink, writeFile } from "fs/promises";
import path from "path";
import type {
  AdminSettings,
  AnalyticsStore,
  DashboardStats,
  PublicSettings,
} from "./types";

const DATA_DIR =
  process.env.DRAMASHORT_DATA_DIR ||
  path.join(/*turbopackIgnore: true*/ process.cwd(), ".dramashort-data");
const SETTINGS_PATH = path.join(DATA_DIR, "admin-settings.json");
const ANALYTICS_PATH = path.join(DATA_DIR, "analytics.json");
const SESSION_COOKIE = "dramashort_admin";
const SESSION_TTL_SECONDS = 60 * 60 * 12;

export const DEFAULT_ADMIN_PASSWORD = "admin123";

function nowIso() {
  return new Date().toISOString();
}

async function ensureDataDir() {
  await mkdir(DATA_DIR, { recursive: true });
}

async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const raw = await readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJsonFile(filePath: string, data: unknown) {
  await ensureDataDir();
  const tmpPath = `${filePath}.${process.pid}.tmp`;
  await writeFile(tmpPath, JSON.stringify(data, null, 2));
  await rename(tmpPath, filePath);
}

function hashPassword(password: string, salt: string) {
  return createHash("sha256").update(`${salt}:${password}`).digest("hex");
}

function defaultAdmin() {
  const salt = randomBytes(16).toString("hex");
  return {
    username: process.env.ADMIN_USERNAME || "admin",
    passwordSalt: salt,
    passwordHash: hashPassword(process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD, salt),
  };
}

export function getDefaultSettings(): AdminSettings {
  return {
    whitelabel: {
      siteName: "DramaShort",
      siteTagline: "Shordrama Streaming Platform",
      logoUrl: "",
      faviconUrl: "",
      footerText: "All rights reserved.",
      footerHtml: "Platform streaming shordrama dari provider resmi captain.sapimu.au.",
    },
    seo: {
      title: "DramaShort — Shordrama Streaming",
      titleTemplate: "%s | DramaShort",
      description: "Stream short dramas from all supported captain.sapimu.au drama platforms.",
      keywords: "shordrama, short drama, drama streaming, dramashort",
      ogImageUrl: "",
    },
    ads: {
      headScript: "",
      bodyScript: "",
      antiAdblockEnabled: false,
      antiAdblockMessage: "Matikan adblock untuk mendukung layanan ini.",
      antiAdblockScript: "",
    },
    carousel: {
      enabled: true,
      title: "Trending Sekarang",
      itemCount: 20,
      speedSeconds: 45,
    },
    cache: {
      enabled: false,
      localEnabled: true,
      localMaxBytes: 10 * 1024 * 1024 * 1024,
      retentionDays: 7,
      r2Enabled: false,
      r2PublicBaseUrl: "",
    },
    cloudflare: {
      securityHeadersEnabled: true,
      ddosProtectionEnabled: false,
      challengeMode: "medium",
      notes:
        "Aktifkan Cloudflare proxy, WAF managed rules, Bot Fight Mode, dan rate limiting di dashboard Cloudflare.",
    },
    admin: defaultAdmin(),
    updatedAt: nowIso(),
  };
}

function mergeSettings(settings: Partial<AdminSettings>): AdminSettings {
  const defaults = getDefaultSettings();
  return {
    ...defaults,
    ...settings,
    whitelabel: { ...defaults.whitelabel, ...settings.whitelabel },
    seo: { ...defaults.seo, ...settings.seo },
    ads: { ...defaults.ads, ...settings.ads },
    carousel: { ...defaults.carousel, ...settings.carousel },
    cache: { ...defaults.cache, ...settings.cache },
    cloudflare: { ...defaults.cloudflare, ...settings.cloudflare },
    admin: { ...defaults.admin, ...settings.admin },
    updatedAt: settings.updatedAt || defaults.updatedAt,
  };
}

export async function getAdminSettings(): Promise<AdminSettings> {
  const settings = await readJsonFile<Partial<AdminSettings>>(SETTINGS_PATH, {});
  return mergeSettings(settings);
}

export async function getPublicSettings(): Promise<PublicSettings> {
  const settings = await getAdminSettings();
  return {
    whitelabel: settings.whitelabel,
    seo: settings.seo,
    ads: settings.ads,
    carousel: settings.carousel,
    cache: {
      enabled: settings.cache.enabled,
      localEnabled: settings.cache.localEnabled,
      r2Enabled: settings.cache.r2Enabled,
      r2PublicBaseUrl: settings.cache.r2PublicBaseUrl,
    },
    cloudflare: {
      securityHeadersEnabled: settings.cloudflare.securityHeadersEnabled,
      ddosProtectionEnabled: settings.cloudflare.ddosProtectionEnabled,
    },
  };
}

function cleanText(value: unknown, fallback = "") {
  return typeof value === "string" ? value.slice(0, 20_000) : fallback;
}

function cleanUrl(value: unknown) {
  const text = cleanText(value).trim();
  if (!text) return "";
  if (text.startsWith("/") || text.startsWith("https://") || text.startsWith("http://")) {
    return text;
  }
  return "";
}

function cleanBoolean(value: unknown) {
  return value === true || value === "on" || value === "true";
}

function cleanNumber(value: unknown, fallback: number, min: number, max: number) {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

export async function updateAdminSettings(form: FormData) {
  const current = await getAdminSettings();
  const challengeMode = cleanChallengeMode(form.get("challengeMode"), current.cloudflare.challengeMode);
  const next: AdminSettings = {
    ...current,
    whitelabel: {
      siteName: cleanText(form.get("siteName"), current.whitelabel.siteName).trim() || current.whitelabel.siteName,
      siteTagline: cleanText(form.get("siteTagline"), current.whitelabel.siteTagline).trim(),
      logoUrl: cleanUrl(form.get("logoUrl")),
      faviconUrl: cleanUrl(form.get("faviconUrl")),
      footerText: cleanText(form.get("footerText"), current.whitelabel.footerText).trim(),
      footerHtml: cleanText(form.get("footerHtml"), current.whitelabel.footerHtml),
    },
    seo: {
      title: cleanText(form.get("seoTitle"), current.seo.title).trim() || current.seo.title,
      titleTemplate:
        cleanText(form.get("seoTitleTemplate"), current.seo.titleTemplate).trim() ||
        current.seo.titleTemplate,
      description: cleanText(form.get("seoDescription"), current.seo.description).trim(),
      keywords: cleanText(form.get("seoKeywords"), current.seo.keywords).trim(),
      ogImageUrl: cleanUrl(form.get("ogImageUrl")),
    },
    ads: {
      headScript: cleanText(form.get("headScript")),
      bodyScript: cleanText(form.get("bodyScript")),
      antiAdblockEnabled: cleanBoolean(form.get("antiAdblockEnabled")),
      antiAdblockMessage: cleanText(
        form.get("antiAdblockMessage"),
        current.ads.antiAdblockMessage,
      ).trim(),
      antiAdblockScript: cleanText(form.get("antiAdblockScript")),
    },
    carousel: {
      enabled: cleanBoolean(form.get("carouselEnabled")),
      title: cleanText(form.get("carouselTitle"), current.carousel.title).trim() || current.carousel.title,
      itemCount: cleanNumber(form.get("carouselItemCount"), current.carousel.itemCount, 5, 60),
      speedSeconds: cleanNumber(form.get("carouselSpeedSeconds"), current.carousel.speedSeconds, 12, 180),
    },
    cache: {
      enabled: cleanBoolean(form.get("cacheEnabled")),
      localEnabled: cleanBoolean(form.get("localCacheEnabled")),
      localMaxBytes: cleanNumber(
        form.get("localMaxGb"),
        current.cache.localMaxBytes / 1024 / 1024 / 1024,
        1,
        10,
      ) * 1024 * 1024 * 1024,
      retentionDays: cleanNumber(form.get("retentionDays"), current.cache.retentionDays, 1, 90),
      r2Enabled: cleanBoolean(form.get("r2Enabled")),
      r2PublicBaseUrl: cleanUrl(form.get("r2PublicBaseUrl")),
    },
    cloudflare: {
      securityHeadersEnabled: cleanBoolean(form.get("securityHeadersEnabled")),
      ddosProtectionEnabled: cleanBoolean(form.get("ddosProtectionEnabled")),
      challengeMode,
      notes: cleanText(form.get("cloudflareNotes"), current.cloudflare.notes),
    },
    admin: current.admin,
    updatedAt: nowIso(),
  };

  const newUsername = cleanText(form.get("adminUsername"), current.admin.username).trim();
  const newPassword = cleanText(form.get("adminPassword")).trim();
  if (newUsername) next.admin.username = newUsername;
  if (newPassword) {
    const salt = randomBytes(16).toString("hex");
    next.admin.passwordSalt = salt;
    next.admin.passwordHash = hashPassword(newPassword, salt);
  }

  await writeJsonFile(SETTINGS_PATH, next);
  return next;
}

function cleanChallengeMode(
  value: FormDataEntryValue | null,
  fallback: AdminSettings["cloudflare"]["challengeMode"],
): AdminSettings["cloudflare"]["challengeMode"] {
  if (
    value === "under_attack" ||
    value === "high" ||
    value === "medium" ||
    value === "low" ||
    value === "essentially_off" ||
    value === "off"
  ) {
    return value;
  }
  return fallback;
}

export function createAdminSession(username: string) {
  const expiresAt = Date.now() + SESSION_TTL_SECONDS * 1000;
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.API_KEY || "dramashort-dev-secret";
  const payload = `${username}:${expiresAt}`;
  const signature = createHash("sha256").update(`${payload}:${secret}`).digest("hex");
  return {
    name: SESSION_COOKIE,
    value: Buffer.from(`${payload}:${signature}`).toString("base64url"),
    maxAge: SESSION_TTL_SECONDS,
  };
}

export function verifyAdminSession(value?: string | null) {
  if (!value) return false;
  try {
    const decoded = Buffer.from(value, "base64url").toString("utf8");
    const parts = decoded.split(":");
    if (parts.length !== 3) return false;
    const [username, expiresAtRaw, signature] = parts;
    const expiresAt = Number(expiresAtRaw);
    if (!username || !Number.isFinite(expiresAt) || Date.now() > expiresAt) return false;
    const secret = process.env.ADMIN_SESSION_SECRET || process.env.API_KEY || "dramashort-dev-secret";
    const expected = createHash("sha256")
      .update(`${username}:${expiresAt}:${secret}`)
      .digest("hex");
    if (signature.length !== expected.length) return false;
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

export async function verifyAdminPassword(username: string, password: string) {
  const settings = await getAdminSettings();
  if (username !== settings.admin.username) return false;
  const hash = hashPassword(password, settings.admin.passwordSalt);
  if (hash.length !== settings.admin.passwordHash.length) return false;
  return timingSafeEqual(Buffer.from(hash), Buffer.from(settings.admin.passwordHash));
}

function emptyAnalytics(): AnalyticsStore {
  return { visits: {}, watches: {} };
}

export async function getAnalytics(): Promise<AnalyticsStore> {
  return readJsonFile<AnalyticsStore>(ANALYTICS_PATH, emptyAnalytics());
}

export async function writeAnalytics(data: AnalyticsStore) {
  await writeJsonFile(ANALYTICS_PATH, data);
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const analytics = await getAnalytics();
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const month = today.slice(0, 7);
  const sevenDays = new Set(
    Array.from({ length: 7 }).map((_, index) => {
      const date = new Date(now);
      date.setDate(now.getDate() - index);
      return date.toISOString().slice(0, 10);
    }),
  );

  return {
    visitorsToday: analytics.visits[today] || 0,
    visitorsSevenDays: Object.entries(analytics.visits)
      .filter(([date]) => sevenDays.has(date))
      .reduce((total, [, count]) => total + count, 0),
    visitorsMonth: Object.entries(analytics.visits)
      .filter(([date]) => date.startsWith(month))
      .reduce((total, [, count]) => total + count, 0),
    topWatched: Object.values(analytics.watches)
      .sort((a, b) => b.count - a.count)
      .slice(0, 20),
  };
}

export async function getCacheUsageBytes(cacheDir: string) {
  let total = 0;
  try {
    const entries = await import("fs/promises").then((fs) => fs.readdir(cacheDir, { withFileTypes: true }));
    for (const entry of entries) {
      const entryPath = path.join(cacheDir, entry.name);
      if (entry.isDirectory()) {
        total += await getCacheUsageBytes(entryPath);
      } else {
        total += (await stat(entryPath)).size;
      }
    }
  } catch {
    return total;
  }
  return total;
}

export async function pruneFile(filePath: string) {
  try {
    await unlink(filePath);
  } catch {}
}
