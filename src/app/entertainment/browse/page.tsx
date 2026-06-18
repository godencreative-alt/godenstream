"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
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

const SUBCATEGORIES = [
  { value: "movie", label: "Movie" },
  { value: "adult", label: "Adult" },
];

const ADULT_TYPES = [
  { value: "west", label: "West" },
  { value: "indonesia", label: "Indonesia" },
  { value: "asian", label: "Asian" },
  { value: "jav", label: "JAV" },
];

export default function EntertainmentBrowsePage() {
  const sp = useSearchParams();
  const initialSubcategory = sp.get("subcategory") ?? "movie";
  const initialType = sp.get("type") ?? "west";

  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [subcategory, setSubcategory] = useState(initialSubcategory);
  const [adultType, setAdultType] = useState(initialType);
  const [genre, setGenre] = useState("");

  useEffect(() => {
    setSubcategory(sp.get("subcategory") ?? "movie");
    setAdultType(sp.get("type") ?? "west");
  }, [sp]);

  const { data: adultGenreData } = useQuery({
    queryKey: ["entertainment-genres", subcategory, subcategory === "adult" ? adultType : undefined],
    queryFn: () => fetchEntertainmentGenres(subcategory),
    enabled: subcategory === "adult",
    staleTime: 1000 * 60 * 60,
  });

  const { data: movieGenreData } = useQuery({
    queryKey: ["entertainment-movie-genres", subcategory],
    queryFn: () => fetchEntertainmentGenres(subcategory),
    enabled: subcategory === "movie",
    staleTime: 1000 * 60 * 60,
  });

  const genres = subcategory === "adult"
    ? (adultGenreData?.data ?? [])
    : (movieGenreData?.data ?? []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearch(input.trim());
  }

  function handleSubcategoryChange(cat: string) {
    setSubcategory(cat);
    setGenre("");
    setSearch("");
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
        {SUBCATEGORIES.map((cat) => (
          <button
            key={cat.value}
            type="button"
            onClick={() => handleSubcategoryChange(cat.value)}
            className={`rounded-full px-4 py-1.5 text-[12px] font-semibold transition-colors ${
              subcategory === cat.value
                ? "bg-[var(--dc-gold)]/20 text-[var(--dc-gold)]"
                : "border border-white/[0.08] text-white/45 hover:text-white/70"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {subcategory === "adult" && (
        <div className="mb-4 flex flex-wrap gap-2">
          {ADULT_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => {
                setAdultType(t.value);
                setGenre("");
                setSearch("");
              }}
              className={`rounded-full px-3 py-1 text-[11px] font-medium transition-colors ${
                adultType === t.value
                  ? "bg-[var(--dc-rose)]/20 text-[var(--dc-rose)]"
                  : "border border-white/[0.08] text-white/30 hover:text-white/60"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      <GenreChips
        genres={genres}
        selected={genre}
        onSelect={setGenre}
        accentClass="bg-[var(--dc-gold)]/20 text-[var(--dc-gold)]"
      />

      <InfiniteGrid
        queryKey={["entertainment-browse", search, subcategory, subcategory === "adult" ? adultType : "all", genre]}
        queryFn={(page) => {
          const req = search
            ? fetchEntertainmentSearch(search, page, subcategory)
            : fetchEntertainmentLatest(page, subcategory, genre || undefined);
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
        buildHref={(key) =>
          `/entertainment/${encodeURIComponent(key)}?subcategory=${encodeURIComponent(subcategory)}${subcategory === "adult" ? `&type=${encodeURIComponent(adultType)}` : ''}`
        }
        emptyMessage="Konten entertainment belum tersedia"
      />
    </div>
  );
}
