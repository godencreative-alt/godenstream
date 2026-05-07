import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://godenstream.example.com";

  const platforms = ["drama-id", "dramabox", "melolo", "netshort", "dramanova"];
  const pages = [
    "trending",
    "popular",
    "terbaru",
    "syarat-dan-ketentuan",
    "kebijakan-privasi",
    "dmca",
    "tentang",
  ];

  const entries: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${baseUrl}/pricing`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
  ];

  for (const page of pages) {
    entries.push({
      url: `${baseUrl}/${page}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    });
  }

  for (const platform of platforms) {
    entries.push({
      url: `${baseUrl}/platform/${platform}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    });
  }

  return entries;
}
