"use client";

import InfiniteGrid from "@/components/sections/InfiniteGrid";
import { fetchMovieLatest, toPaginated } from "@/lib/api";

export default function MovieboxHomePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
      <header className="mb-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[var(--dc-orange)]">
          Movie
        </p>
        <h1
          className="text-3xl font-bold text-white md:text-4xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Film Terbaru
        </h1>
      </header>

      <InfiniteGrid
        queryKey={["movie-latest-infinite"]}
        queryFn={(page) =>
          fetchMovieLatest(page).then((r) => ({
            ...toPaginated(r, page),
            data: r.data.map((item) => ({
              ...item,
              id: item.slug ?? "",
              cover_url: item.thumbnail,
            })),
          }))
        }
        hrefPrefix="/moviebox"
        emptyMessage="Konten film belum tersedia"
      />
    </div>
  );
}
