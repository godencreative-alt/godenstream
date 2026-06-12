"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import InfiniteGrid from "@/components/sections/InfiniteGrid";
import GenreChips from "@/components/sections/GenreChips";
import {
  fetchAdultLatest,
  fetchAdultSearch,
  toPaginated,
} from "@/lib/api";

const TYPES = [
  { value: "jav", label: "JAV" },
  { value: "korea", label: "Korea" },
  { value: "indonesia", label: "Indonesia" },
];

// Static per-type genres (backend adult /genres is type-aware but small;
// kept inline to avoid an extra request and match backend _ADULT_GENRES).
const GENRES: Record<string, string[]> = {
  jav: ["JAV", "Amateur", "Big Tits", "Censored", "Uncensored", "Cosplay", "Hardcore", "MILF", "Schoolgirl"],
  korea: ["Korean", "Romance", "Drama", "Amateur"],
  indonesia: [],
};

export default function AdultBrowsePage() {
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [type, setType] = useState("jav");
  const [genre, setGenre] = useState("");

  const genres = GENRES[type] ?? [];

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
        Browse 18+
      </h1>

      <form onSubmit={handleSearch} className="mb-5">
        <div className="relative max-w-lg">
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/30" />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Cari…"
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
                ? "bg-[var(--dc-rose)]/20 text-[var(--dc-rose)]"
                : "border border-white/[0.08] text-white/45 hover:text-white/70"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <GenreChips
        genres={genres}
        selected={genre}
        onSelect={setGenre}
        accentClass="bg-[var(--dc-rose)]/20 text-[var(--dc-rose)]"
      />

      <InfiniteGrid
        queryKey={["adult-browse", search, type, genre]}
        queryFn={(page) => {
          const req = search
            ? fetchAdultSearch(search, page, type, undefined, genre || undefined)
            : fetchAdultLatest(page, type, undefined, genre || undefined);
          return req.then((r) => ({
            ...toPaginated(r, page),
            data: r.data.map((item) => ({
              ...item,
              id: item.slug ?? item.video_id ?? "",
              cover_url: item.thumbnail,
            })),
          }));
        }}
        hrefPrefix="/adult"
        buildHref={(key) =>
          `/adult/${encodeURIComponent(key)}?type=${encodeURIComponent(type)}`
        }
        emptyMessage="Konten belum tersedia"
      />
    </div>
  );
}
