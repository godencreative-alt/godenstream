"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { fetchProviders, fetchTags } from "@/lib/api";
import { fetchDramas } from "@/lib/api";
import InfiniteGrid from "@/components/sections/InfiniteGrid";
import { Spinner } from "@/components/ui/Spinner";

function BrowseContent() {
  const searchParams = useSearchParams();
  const tagParam = searchParams.get("tag") || "";

  const [sortBy, setSortBy] = useState<string>("updated_at");
  const [provider, setProvider] = useState("");
  const [tag, setTag] = useState(tagParam);
  const [showAllGenres, setShowAllGenres] = useState(false);

  const { data: providers } = useQuery({
    queryKey: ["providers"],
    queryFn: fetchProviders,
  });

  const { data: tags } = useQuery({
    queryKey: ["tags"],
    queryFn: fetchTags,
  });

  const displayedTags = showAllGenres ? tags : tags?.slice(0, 12);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
      <h1 className="mb-6 text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
        Browse Dramas
      </h1>

      {/* Filters */}
      <div className="mb-6 space-y-3">
        {/* Sort */}
        <div className="flex flex-wrap gap-2">
          <span className="text-[11px] font-medium text-white/30 self-center mr-2">Sort:</span>
          {[
            { value: "updated_at", label: "Latest" },
            { value: "play_count", label: "Most Viewed" },
            { value: "chapter_count", label: "Episodes" },
            { value: "title", label: "Title" },
          ].map((s) => (
            <button
              key={s.value}
              onClick={() => setSortBy(s.value)}
              className={`rounded-lg px-3 py-1 text-[12px] font-medium transition-colors ${
                sortBy === s.value
                  ? "bg-[var(--dc-gold)]/15 text-[var(--dc-gold)]"
                  : "text-white/40 hover:text-white/60"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Provider chips */}
        {providers && providers.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            <span className="text-[11px] font-medium text-white/30 self-center mr-2">Provider:</span>
            <button
              onClick={() => setProvider("")}
              className={`rounded-lg border px-2.5 py-1 text-[11px] ${
                !provider
                  ? "border-[var(--dc-gold)]/30 bg-[var(--dc-gold)]/10 text-[var(--dc-gold)]"
                  : "border-white/[0.06] text-white/40 hover:text-white/60"
              }`}
            >
              All
            </button>
            {providers.map((p) => (
              <button
                key={p.id}
                onClick={() => setProvider(p.slug)}
                className={`rounded-lg border px-2.5 py-1 text-[11px] ${
                  provider === p.slug
                    ? "border-[var(--dc-gold)]/30 bg-[var(--dc-gold)]/10 text-[var(--dc-gold)]"
                    : "border-white/[0.06] text-white/40 hover:text-white/60"
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        )}

        {/* Genre tags */}
        {displayedTags && displayedTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            <span className="text-[11px] font-medium text-white/30 self-center mr-2">Genre:</span>
            <button
              onClick={() => setTag("")}
              className={`rounded-lg border px-2.5 py-1 text-[11px] ${
                !tag
                  ? "border-[var(--dc-gold)]/30 bg-[var(--dc-gold)]/10 text-[var(--dc-gold)]"
                  : "border-white/[0.06] text-white/40 hover:text-white/60"
              }`}
            >
              All
            </button>
            {displayedTags.map((t) => (
              <button
                key={t.id}
                onClick={() => setTag(t.name)}
                className={`rounded-lg border px-2.5 py-1 text-[11px] ${
                  tag === t.name
                    ? "border-[var(--dc-gold)]/30 bg-[var(--dc-gold)]/10 text-[var(--dc-gold)]"
                    : "border-white/[0.06] text-white/40 hover:text-white/60"
                }`}
              >
                {t.en_name || t.name}
              </button>
            ))}
            {tags && tags.length > 12 && (
              <button
                onClick={() => setShowAllGenres(!showAllGenres)}
                className="text-[11px] text-white/30 hover:text-white/50"
              >
                {showAllGenres ? "Show less" : `+${tags.length - 12} more`}
              </button>
            )}
          </div>
        )}

        {(provider || tag || sortBy !== "updated_at") && (
          <button
            onClick={() => {
              setProvider("");
              setTag("");
              setSortBy("updated_at");
            }}
            className="text-[11px] text-red-400 hover:text-red-300"
          >
            Clear filters
          </button>
        )}
      </div>

      <InfiniteGrid
        queryKey={["dramas-browse", sortBy, provider, tag]}
        queryFn={(page) =>
          fetchDramas({
            page,
            per_page: 24,
            sort_by: sortBy as "updated_at",
            provider: provider || undefined,
            tag: tag || undefined,
          })
        }
        hrefPrefix="/drama"
      />
    </div>
  );
}

export default function DramaBrowsePage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Spinner size="lg" /></div>}>
      <BrowseContent />
    </Suspense>
  );
}
