"use client";

import { useState } from "react";
import { fetchAnimeList } from "@/lib/api";
import InfiniteGrid from "@/components/sections/InfiniteGrid";

export default function AnimeBrowsePage() {
  const [sortBy, setSortBy] = useState("updated_at");

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
      <h1 className="mb-6 text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>Browse Anime</h1>
      <div className="mb-6 flex flex-wrap gap-2">
        {[{ value: "updated_at", label: "Latest" }, { value: "popularity", label: "Popular" }].map((s) => (
          <button key={s.value} onClick={() => setSortBy(s.value)}
            className={`rounded-lg px-3 py-1 text-[12px] font-medium ${sortBy === s.value ? "bg-[var(--dc-violet)]/15 text-[var(--dc-violet)]" : "text-white/40 hover:text-white/60"}`}>
            {s.label}
          </button>
        ))}
      </div>
      <InfiniteGrid
        queryKey={["anime-browse", sortBy]}
        queryFn={(page) => fetchAnimeList({ page, per_page: 24, sort_by: sortBy })}
        hrefPrefix="/anime"
      />
    </div>
  );
}
