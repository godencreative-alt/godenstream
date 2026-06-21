"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import InfiniteGrid from "@/components/sections/InfiniteGrid";
import GenreChips from "@/components/sections/GenreChips";
import SearchInput from "@/components/ui/SearchInput";
import PillTabs from "@/components/ui/PillTabs";
import {
  fetchComicLatest,
  fetchComicSearch,
  fetchComicGenres,
  toPaginated,
} from "@/lib/api";

const TYPES = [
  { value: "manga", label: "Manga" },
  { value: "manhua", label: "Manhua" },
  { value: "manhwa", label: "Manhwa" },
  { value: "adult", label: "Adult" },
];

export default function ComicBrowsePage() {
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [type, setType] = useState("manga");
  const [genre, setGenre] = useState("");

  const { data: genreData } = useQuery({
    queryKey: ["comic-genres", type],
    queryFn: () => fetchComicGenres({ type }),
    staleTime: 1000 * 60 * 60,
  });
  const genres = genreData?.data ?? [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
      <h1
        className="mb-6 text-2xl font-bold"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Browse Comic
      </h1>

      <div className="mb-5">
        <SearchInput
          value={input}
          onChange={setInput}
          onSubmit={(q) => setSearch(q)}
          placeholder="Cari komik…"
        />
      </div>

      <PillTabs
        tabs={TYPES}
        selected={type}
        onSelect={(v) => { setType(v); setGenre(""); }}
        accentColor="var(--dc-rose)"
      />

      <GenreChips
        genres={genres}
        selected={genre}
        onSelect={setGenre}
        accentClass="bg-[var(--dc-rose)]/20 text-[var(--dc-rose)]"
      />

      <InfiniteGrid
        queryKey={["comic-browse", search, type, genre]}
        queryFn={(page) => {
          const opts = { type, genre: genre || undefined };
          const req = search
            ? fetchComicSearch(search, page, opts)
            : fetchComicLatest(page, opts);
          return req.then((r) => ({
            ...toPaginated(r, page),
            data: r.data.map((item) => ({
              ...item,
              id: item.slug ?? "",
              cover_url: item.thumbnail,
            })),
          }));
        }}
        hrefPrefix="/comic"
        buildHref={(key) => `/comic/${encodeURIComponent(key)}?type=${type}`}
        emptyMessage="Konten komik belum tersedia"
      />
    </div>
  );
}
