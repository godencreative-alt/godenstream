export interface WhitelabelSettings {
  siteName: string;
  siteTagline: string;
  logoUrl: string;
  faviconUrl: string;
  footerText: string;
  footerHtml: string;
}

export interface SeoSettings {
  title: string;
  titleTemplate: string;
  description: string;
  keywords: string;
  ogImageUrl: string;
}

export interface AdSettings {
  headScript: string;
  bodyScript: string;
  antiAdblockEnabled: boolean;
  antiAdblockMessage: string;
  antiAdblockScript: string;
}

export interface CarouselSettings {
  enabled: boolean;
  title: string;
  itemCount: number;
  speedSeconds: number;
}

export interface CacheSettings {
  enabled: boolean;
  localEnabled: boolean;
  localMaxBytes: number;
  retentionDays: number;
  r2Enabled: boolean;
  r2PublicBaseUrl: string;
}

export interface CloudflareSettings {
  securityHeadersEnabled: boolean;
  ddosProtectionEnabled: boolean;
  challengeMode: "off" | "essentially_off" | "low" | "medium" | "high" | "under_attack";
  notes: string;
}

export interface AdminUserSettings {
  username: string;
  passwordHash: string;
  passwordSalt: string;
}

export interface AdminSettings {
  whitelabel: WhitelabelSettings;
  seo: SeoSettings;
  ads: AdSettings;
  carousel: CarouselSettings;
  cache: CacheSettings;
  cloudflare: CloudflareSettings;
  admin: AdminUserSettings;
  updatedAt: string;
}

export interface PublicSettings {
  whitelabel: WhitelabelSettings;
  seo: SeoSettings;
  ads: AdSettings;
  carousel: CarouselSettings;
  cache: Pick<CacheSettings, "enabled" | "localEnabled" | "r2Enabled" | "r2PublicBaseUrl">;
  cloudflare: Pick<CloudflareSettings, "securityHeadersEnabled" | "ddosProtectionEnabled">;
}

export interface AnalyticsStore {
  visits: Record<string, number>;
  watches: Record<
    string,
    {
      key: string;
      title: string;
      providerName: string;
      providerSlug: string;
      coverUrl: string | null;
      href: string;
      count: number;
      lastWatchedAt: string;
    }
  >;
}

export interface DashboardStats {
  visitorsToday: number;
  visitorsSevenDays: number;
  visitorsMonth: number;
  topWatched: AnalyticsStore["watches"][string][];
}
