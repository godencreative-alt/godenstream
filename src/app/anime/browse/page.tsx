"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import InfiniteGrid from "@/components/sections/InfiniteGrid";
import GenreChips from "@/components/sections/GenreChips";
import PillTabs from "@/components/ui/PillTabs";
import SearchInput from "@/components/ui/SearchInput";
import { ErrorState } from "@/components/ui/ErrorState";
import {
  fetchAnimeLatest,
  fetchAnimeSearch,
  fetchAnimeGenres,
  toPaginated,
} from "@/lib/api";

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

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
      <h1
        className="mb-6 text-2xl font-bold"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Browse Anime
      </h1>

      <div className="mb-5">
        <SearchInput
          value={input}
          onChange={setInput}
          onSubmit={setSearch}
          placeholder="Cari anime…"
        />
      </div>

      <div className="mb-4">
        <PillTabs
          tabs={TYPES}
          selected={type}
          onSelect={(v) => { setType(v); setGenre(""); }}
          accentColor="var(--dc-rose)"
        />
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
