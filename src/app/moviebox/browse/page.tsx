"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import InfiniteGrid from "@/components/sections/InfiniteGrid";
import GenreChips from "@/components/sections/GenreChips";
import SearchInput from "@/components/ui/SearchInput";
import {
  fetchMovieLatest,
  fetchMovieSearch,
  fetchMovieGenres,
  toPaginated,
} from "@/lib/api";

export default function MovieboxBrowsePage() {
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("");

  const { data: genreData } = useQuery({
    queryKey: ["movie-genres"],
    queryFn: () => fetchMovieGenres(),
    staleTime: 1000 * 60 * 60,
  });
  const genres = genreData?.data ?? [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
      <h1
        className="mb-6 text-2xl font-bold"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Browse Movie
      </h1>

      <div className="mb-5">
        <SearchInput
          value={input}
          onChange={setInput}
          onSubmit={(q) => setSearch(q)}
          placeholder="Cari film…"
        />
      </div>

      <GenreChips
        genres={genres}
        selected={genre}
        onSelect={setGenre}
        accentClass="bg-[var(--dc-gold)]/20 text-[var(--dc-gold)]"
      />

      <InfiniteGrid
        queryKey={["movie-browse", search, genre]}
        queryFn={(page) => {
          const req = search
            ? fetchMovieSearch(search, page, undefined, genre || undefined)
            : fetchMovieLatest(page, undefined, genre || undefined);
          return req.then((r) => ({
            ...toPaginated(r, page),
            data: r.data.map((item) => ({
              ...item,
              id: item.slug ?? "",
              cover_url: item.thumbnail,
            })),
          }));
        }}
        hrefPrefix="/moviebox"
      />
    </div>
  );
}
