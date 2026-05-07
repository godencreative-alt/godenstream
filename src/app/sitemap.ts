import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://godenstream.example.com";

  const sections = ["drama", "anime", "moviebox", "iqiyi", "wetv"];
  const pages = ["", "/browse", "/popular", "/search"];

  const entries: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${baseUrl}/pricing`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
  ];

  for (const section of sections) {
    for (const page of pages) {
      entries.push({
        url: `${baseUrl}/${section}${page}`,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: page === "" ? 0.9 : 0.7,
      });
    }
  }

  return entries;
}
