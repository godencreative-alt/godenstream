"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import InfiniteGrid from "@/components/sections/InfiniteGrid";
import GenreChips from "@/components/sections/GenreChips";
import {
  fetchEntertainmentLatest,
  fetchEntertainmentSearch,
  fetchEntertainmentGenres,
  toPaginated,
} from "@/lib/api";

const CATEGORIES = [
  { value: "movie", label: "Movie" },
  { value: "adult", label: "Adult" },
];

export default function EntertainmentBrowsePage() {
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("movie");
  const [genre, setGenre] = useState("");

  const { data: genreData } = useQuery({
    queryKey: ["entertainment-genres", category],
    queryFn: () => fetchEntertainmentGenres(category),
    staleTime: 1000 * 60 * 60,
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
        Browse Entertainment
      </h1>

      <form onSubmit={handleSearch} className="mb-5">
        <div className="relative max-w-lg">
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/30" />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Cari entertainment…"
            className="h-12 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] pl-12 pr-4 text-sm text-white placeholder:text-white/25 focus:border-white/20 focus:outline-none"
          />
        </div>
      </form>

      <div className="mb-4 flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            type="button"
            onClick={() => {
              setCategory(cat.value);
              setGenre("");
              setSearch("");
            }}
            className={`rounded-full px-4 py-1.5 text-[12px] font-semibold transition-colors ${
              category === cat.value
                ? "bg-[var(--dc-gold)]/20 text-[var(--dc-gold)]"
                : "border border-white/[0.08] text-white/45 hover:text-white/70"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <GenreChips
        genres={genres}
        selected={genre}
        onSelect={setGenre}
        accentClass="bg-[var(--dc-gold)]/20 text-[var(--dc-gold)]"
      />

      <InfiniteGrid
        queryKey={["entertainment-browse", search, category, genre]}
        queryFn={(page) => {
          const opts = { page, category, genre: genre || undefined };
          const req = search
            ? fetchEntertainmentSearch(search, page, category)
            : fetchEntertainmentLatest(page, category, genre || undefined);
          return req.then((r) => ({
            ...toPaginated(r, page),
            data: r.data.map((item) => ({
              ...item,
              id: item.slug ?? "",
              cover_url: item.thumbnail,
            })),
          }));
        }}
        hrefPrefix="/entertainment"
        emptyMessage="Konten entertainment belum tersedia"
      />
    </div>
  );
}
