"use client";

import { useState } from "react";
import InfiniteGrid from "@/components/sections/InfiniteGrid";
import { fetchComicPopular, toPaginated } from "@/lib/api";

const TYPES = [
  { value: "manga", label: "Manga" },
  { value: "manhua", label: "Manhua" },
  { value: "manhwa", label: "Manhwa" },
  { value: "adult", label: "Adult" },
];

export default function ComicPopularPage() {
  const [type, setType] = useState("manga");

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
      <header className="mb-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[var(--dc-emerald)]">
          Comic
        </p>
        <h1
          className="text-3xl font-bold text-white md:text-4xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Komik Populer
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
                ? "bg-[var(--dc-emerald)]/20 text-[var(--dc-emerald)]"
                : "border border-white/[0.08] text-white/45 hover:text-white/70"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <InfiniteGrid
        queryKey={["comic-popular-infinite", type]}
        queryFn={(page) =>
          fetchComicPopular(page, { type }).then((r) => ({
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
