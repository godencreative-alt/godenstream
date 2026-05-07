"use client";

import { fetchAnimePopular } from "@/lib/api";
import InfiniteGrid from "@/components/sections/InfiniteGrid";

export default function AnimePopularPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
      <h1 className="mb-6 text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>Popular Anime</h1>
      <InfiniteGrid
        queryKey={["anime-popular-grid"]}
        queryFn={(page) => fetchAnimePopular({ per_page: 24 }).then((r) => ({ ...r, meta: { ...r.meta, page } }))}
        hrefPrefix="/anime"
      />
    </div>
  );
}
