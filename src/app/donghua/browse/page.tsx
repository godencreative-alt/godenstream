"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import InfiniteGrid from "@/components/sections/InfiniteGrid";
import GenreChips from "@/components/sections/GenreChips";
import SearchInput from "@/components/ui/SearchInput";
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

      <div className="mb-5">
        <SearchInput
          value={input}
          onChange={setInput}
          onSubmit={(q) => { setGenre(""); setSearch(q); }}
          placeholder="Cari donghua…"
        />
      </div>

      {genres.length > 0 && (
        <GenreChips
          genres={genres}
          selected={genre}
          onSelect={pickGenre}
          accentClass="bg-[var(--dc-cyan)]/20 text-[var(--dc-cyan)]"
        />
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
