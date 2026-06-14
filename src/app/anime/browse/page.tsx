"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import InfiniteGrid from "@/components/sections/InfiniteGrid";
import GenreChips from "@/components/sections/GenreChips";
import { ErrorState } from "@/components/ui/ErrorState";
import {
  fetchAnimeLatest,
  fetchAnimeSearch,
  fetchAnimeGenres,
  toPaginated,
} from "@/lib/api";

// Backend anime endpoint currently scrapes only general anime (otakudesu).
// "Hentai" is shown here as a placeholder — switching to it surfaces the
// "not available yet" state. Will activate once backend adds `type` param.
const TYPES = [
  { value: "anime", label: "Anime" },
  { value: "hentai", label: "Hentai", disabled: true },
];

export default function AnimeBrowsePage() {
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [type, setType] = useState("anime");
  const [genre, setGenre] = useState("");

  const { data: genreData } = useQuery({
    queryKey: ["anime-genres"],
    queryFn: () => fetchAnimeGenres(),
    staleTime: 1000 * 60 * 60,
    enabled: type === "anime",
  });
  const genres = genreData?.data ?? [];

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearch(input.trim());
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
      <h1
        className="mb-6 text-2xl font-bold"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Browse Anime
      </h1>

      <form onSubmit={handleSearch} className="mb-5">
        <div className="relative max-w-lg">
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/30" />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Cari anime…"
            className="h-12 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] pl-12 pr-4 text-sm text-white placeholder:text-white/25 focus:border-white/20 focus:outline-none"
          />
        </div>
      </form>

      <div className="mb-4 flex flex-wrap gap-2">
        {TYPES.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => {
              setType(t.value);
              setGenre("");
            }}
            className={`rounded-full px-4 py-1.5 text-[12px] font-semibold transition-colors ${
              type === t.value
                ? t.disabled
                  ? "bg-white/10 text-white/50"
                  : "bg-[var(--dc-rose)]/20 text-[var(--dc-rose)]"
                : t.disabled
                  ? "border border-white/[0.08] text-white/30 hover:text-white/50"
                  : "border border-white/[0.08] text-white/45 hover:text-white/70"
            }`}
          >
            {t.label}
            {t.disabled && <span className="ml-1 text-[9px]">(soon)</span>}
          </button>
        ))}
      </div>

      {type === "hentai" ? (
        <ErrorState message="Hentai belum tersedia. Backend sedang dipersiapkan." />
      ) : (
        <>
          <GenreChips genres={genres} selected={genre} onSelect={setGenre} />
          <InfiniteGrid
            queryKey={["anime-browse", search, genre]}
            queryFn={(page) => {
              const req = search
                ? fetchAnimeSearch(search, page, genre || undefined)
                : fetchAnimeLatest(page, genre || undefined);
              return req.then((r) => ({
                ...toPaginated(r, page),
                data: r.data.map((item) => ({
                  ...item,
                  id: item.slug ?? "",
                  cover_url: item.thumbnail,
                })),
              }));
            }}
            hrefPrefix="/anime"
          />
        </>
      )}
    </div>
  );
}
