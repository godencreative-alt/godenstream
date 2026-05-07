"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { fetchShordramaSearch } from "@/lib/api";
import ContentCard from "@/components/sections/ContentCard";
import { GridSkeleton } from "@/components/ui/Skeleton";
import { Spinner } from "@/components/ui/Spinner";

function SearchContent() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") || "";
  const [query, setQuery] = useState(q);
  const [debouncedQuery, setDebouncedQuery] = useState(q);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedQuery(query), 400);
    return () => clearTimeout(timeout);
  }, [query]);

  const { data, isLoading } = useQuery({
    queryKey: ["shordrama-search", debouncedQuery],
    queryFn: () => fetchShordramaSearch(debouncedQuery),
    enabled: debouncedQuery.trim().length >= 2,
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
      <h1
        className="mb-2 text-3xl font-bold text-white md:text-4xl"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Cari Shordrama
      </h1>
      <p className="mb-6 text-sm text-white/45">
        Temukan drama pendek dari Drama-ID, DramaBox, Melolo, NetShort, dan FreeReels.
      </p>

      <div className="relative mb-6 max-w-lg">
        <MagnifyingGlassIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/30" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-12 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] pl-12 pr-4 text-sm text-white placeholder:text-white/25 focus:border-[var(--dc-gold)]/40 focus:outline-none"
          placeholder="Cari shordrama..."
          autoFocus
        />
      </div>

      {debouncedQuery.trim().length < 2 ? (
        <p className="text-sm text-white/30">Ketik minimal 2 karakter untuk mencari.</p>
      ) : isLoading ? (
        <GridSkeleton />
      ) : data?.data.length ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6">
          {data.data.map((drama) => (
            <ContentCard
              key={`${drama.provider_slug}-${drama.id}`}
              item={drama}
              href={`/platform/${drama.provider_slug}`}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-white/30">
          Tidak ada shordrama untuk &quot;{debouncedQuery}&quot;.
        </p>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
