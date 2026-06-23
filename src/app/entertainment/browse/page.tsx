"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import InfiniteGrid from "@/components/sections/InfiniteGrid";
import GenreChips from "@/components/sections/GenreChips";
import SearchInput from "@/components/ui/SearchInput";
import PillTabs from "@/components/ui/PillTabs";
import {
  fetchEntertainmentLatest,
  fetchEntertainmentSearch,
  fetchEntertainmentGenres,
  toPaginated,
  decodeAssetBase64,
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

  function handleSubcategoryChange(cat: string) {
    setSubcategory(cat);
    setGenre("");
    setSearch("");
    setInput("");
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
      <h1
        className="mb-6 text-2xl font-bold"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Browse Entertainment
      </h1>

      <div className="mb-5">
        <SearchInput
          value={input}
          onChange={setInput}
          onSubmit={(q) => setSearch(q)}
          placeholder="Cari entertainment…"
        />
      </div>

      <PillTabs
        tabs={SUBCATEGORIES}
        selected={subcategory}
        onSelect={handleSubcategoryChange}
        accentColor="var(--dc-gold)"
      />

      {subcategory === "adult" && (
        <PillTabs
          tabs={ADULT_TYPES}
          selected={adultType}
          onSelect={(v) => { setAdultType(v); setGenre(""); setSearch(""); setInput(""); }}
          accentColor="var(--dc-rose)"
        />
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
          const adultTypeParam = subcategory === "adult" ? adultType : undefined;
          const req = search
            ? fetchEntertainmentSearch(search, page, subcategory, undefined, adultTypeParam)
            : fetchEntertainmentLatest(page, subcategory, genre || undefined, undefined, adultTypeParam);
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
        buildHref={(key, item) => {
          const base = `/entertainment/${encodeURIComponent(key)}?subcategory=${encodeURIComponent(subcategory)}${subcategory === "adult" ? `&type=${encodeURIComponent(adultType)}` : ''}`;
          // For adult content, pass the embed URL so detail page can render iframe directly.
          // The backend sends `video.embed` as a raw URL (e.g. https://host/embed/id),
          // but older payloads used the /v1/asset/<base64> wrapper — handle both.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const embedAsset = (item as any)?.video?.embed as string | undefined;
          if (subcategory === "adult" && embedAsset) {
            const embed = decodeAssetBase64(embedAsset)
              ?? (/^https?:\/\//i.test(embedAsset) ? embedAsset : null);
            if (embed) return `${base}&embed=${encodeURIComponent(embed)}`;
          }
          return base;
        }}
        emptyMessage="Konten entertainment belum tersedia"
      />
    </div>
  );
}
