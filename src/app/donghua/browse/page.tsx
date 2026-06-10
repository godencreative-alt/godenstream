"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import InfiniteGrid from "@/components/sections/InfiniteGrid";
import {
  fetchDonghuaLatest,
  fetchDonghuaSearch,
  fetchDonghuaGenres,
  toPaginated,
} from "@/lib/api";

export default function DonghuaBrowsePage() {
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("");

  const { data: genreData } = useQuery({
    queryKey: ["donghua-genres"],
    queryFn: () => fetchDonghuaGenres(),
    staleTime: 1000 * 60 * 60,
  });
  const genres = genreData?.data ?? [];

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setGenre("");
    setSearch(input.trim());
  }

  function pickGenre(g: string) {
    setInput("");
    setSearch("");
    setGenre((prev) => (prev === g ? "" : g));
  }

  // Effective query: genre uses search keyword (backend donghua list has no
  // genre filter param), free-text search wins when present.
  const effectiveQuery = search || genre;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
      <h1
        className="mb-6 text-2xl font-bold"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Browse Donghua
      </h1>

      <form onSubmit={handleSearch} className="mb-5">
        <div className="relative max-w-lg">
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/30" />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Cari donghua…"
            className="h-12 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] pl-12 pr-4 text-sm text-white placeholder:text-white/25 focus:border-white/20 focus:outline-none"
          />
        </div>
      </form>

      {genres.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {genres.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => pickGenre(g)}
              className={`rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors ${
                genre === g
                  ? "bg-[var(--dc-cyan)]/20 text-[var(--dc-cyan)]"
                  : "border border-white/[0.08] text-white/45 hover:text-white/70"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      )}

      <InfiniteGrid
        queryKey={["donghua-browse", effectiveQuery]}
        queryFn={(page) => {
          const req = effectiveQuery
            ? fetchDonghuaSearch(effectiveQuery, page)
            : fetchDonghuaLatest(page);
          return req.then((r) => ({
            ...toPaginated(r, page),
            data: r.data.map((item) => ({
              ...item,
              id: item.slug ?? "",
              cover_url: item.thumbnail,
            })),
          }));
        }}
        hrefPrefix="/donghua"
        emptyMessage="Konten donghua belum tersedia"
      />
    </div>
  );
}
