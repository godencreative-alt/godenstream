import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://stream.godenpg.dev";

  const sections = [
    { path: "", priority: 1.0, freq: "daily" },
    { path: "/anime", priority: 0.9, freq: "daily" },
    { path: "/anime/browse", priority: 0.8, freq: "daily" },
    { path: "/anime/popular", priority: 0.7, freq: "weekly" },
    { path: "/anime/search", priority: 0.6, freq: "daily" },
    { path: "/donghua", priority: 0.9, freq: "daily" },
    { path: "/donghua/browse", priority: 0.8, freq: "daily" },
    { path: "/donghua/popular", priority: 0.7, freq: "weekly" },
    { path: "/moviebox", priority: 0.9, freq: "daily" },
    { path: "/moviebox/browse", priority: 0.8, freq: "daily" },
    { path: "/moviebox/popular", priority: 0.7, freq: "weekly" },
    { path: "/moviebox/search", priority: 0.6, freq: "daily" },
    { path: "/comic", priority: 0.9, freq: "daily" },
    { path: "/comic/browse", priority: 0.8, freq: "daily" },
    { path: "/comic/popular", priority: 0.7, freq: "weekly" },
    { path: "/entertainment", priority: 0.9, freq: "daily" },
    { path: "/entertainment/browse", priority: 0.8, freq: "daily" },
    { path: "/entertainment/search", priority: 0.6, freq: "daily" },
    { path: "/pricing", priority: 0.5, freq: "monthly" },
    { path: "/privacy", priority: 0.3, freq: "yearly" },
    { path: "/terms", priority: 0.3, freq: "yearly" },
  ];

  return sections.map(({ path, priority, freq }) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: freq as "daily" | "weekly" | "monthly" | "yearly",
    priority,
  }));
}
