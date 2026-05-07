"use client";

import { fetchMovieBoxList } from "@/lib/api";
import InfiniteGrid from "@/components/sections/InfiniteGrid";

export default function MovieBoxPopularPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
      <h1 className="mb-6 text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>Popular on MovieBox</h1>
      <InfiniteGrid queryKey={["moviebox-popular"]} queryFn={(page) => fetchMovieBoxList({ page, per_page: 24, sort_by: "play_count" })} hrefPrefix="/moviebox" />
    </div>
  );
}
