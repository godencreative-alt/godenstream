"use client";

import { useState } from "react";
import InfiniteGrid from "@/components/sections/InfiniteGrid";
import { fetchComicLatest, fetchComicLibrary, toPaginated } from "@/lib/api";

const TYPES = [
  { value: "manga", label: "Manga" },
  { value: "manhua", label: "Manhua" },
  { value: "manhwa", label: "Manhwa" },
  { value: "adult", label: "Adult" },
];

const MODES = [
  { value: "library", label: "Pustaka" },
  { value: "latest", label: "Terbaru" },
];

// Genre tabs for adult subcategory
const ADULT_GENRES = [
  { value: "adult", label: "Video" },
  { value: "doujinshi", label: "Doujinshi" },
];

export default function ComicHomePage() {
  const [type, setType] = useState("manga");
  const [mode, setMode] = useState("library");
  const [adultGenre, setAdultGenre] = useState("adult"); // "adult"=video, "doujinshi"
  const effectiveMode = type === "adult" ? "latest" : mode;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
      <header className="mb-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[var(--dc-rose)]">
          Comic
        </p>
        <h1
          className="text-3xl font-bold text-white md:text-4xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {effectiveMode === "library" ? "Pustaka Komik" : "Komik Terbaru"}
        </h1>
      </header>

      <div className="mb-4 flex flex-wrap gap-2">
        {TYPES.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setType(t.value)}
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

      {type === "adult" ? (
        // Adult genre tabs: Video (default) = lustpress, Doujinshi = jandapress
        <div className="mb-4 flex flex-wrap gap-2">
          {ADULT_GENRES.map((g) => (
            <button
              key={g.value}
              type="button"
              onClick={() => setAdultGenre(g.value)}
              className={`rounded-full px-4 py-1.5 text-[12px] font-semibold transition-colors ${
                adultGenre === g.value
                  ? "bg-[var(--dc-rose)]/20 text-[var(--dc-rose)]"
                  : "border border-white/[0.08] text-white/45 hover:text-white/70"
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>
      ) : (
        <div className="mb-4 flex flex-wrap gap-2">
          {MODES.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => setMode(m.value)}
              className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-colors ${
                effectiveMode === m.value
                  ? "bg-white/[0.12] text-white"
                  : "border border-white/[0.08] text-white/40 hover:text-white/65"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      )}

      <InfiniteGrid
        queryKey={["comic-infinite", effectiveMode, type, adultGenre]}
        queryFn={(page) =>
          (effectiveMode === "library"
            ? fetchComicLibrary(type, page)
            : fetchComicLatest(page, { type, genre: type === "adult" ? adultGenre : undefined })
          ).then((r) => ({
            ...toPaginated(r, page),
            data: r.data.map((item) => ({
              ...item,
              id: item.slug ?? "",
              cover_url: item.thumbnail,
            })),
          }))
        }
        hrefPrefix="/comic"
        buildHref={(key) => `/comic/${encodeURIComponent(key)}?type=${type}`}
        emptyMessage="Konten komik belum tersedia"
      />
    </div>
  );
}
