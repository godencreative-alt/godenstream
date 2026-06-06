"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { fetchMovieSearch } from "@/lib/api";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import ContentCard from "@/components/sections/ContentCard";
import { GridSkeleton } from "@/components/ui/Skeleton";
import { Spinner } from "@/components/ui/Spinner";

function SearchContent() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") || "";
  const [query, setQuery] = useState(q);
  const [debounced, setDebounced] = useState(q);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 400);
    return () => clearTimeout(t);
  }, [query]);

  const { data, isLoading } = useQuery({
    queryKey: ["movie-search", debounced],
    queryFn: () => fetchMovieSearch(debounced),
    enabled: debounced.length >= 2,
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
      <h1
        className="mb-6 text-2xl font-bold"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Search Movie
      </h1>

      <div className="relative mb-6 max-w-lg">
        <MagnifyingGlassIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/30" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-12 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] pl-12 pr-4 text-sm text-white placeholder:text-white/25 focus:border-white/20 focus:outline-none"
          placeholder="Cari film…"
          autoFocus
        />
      </div>

      {debounced.length < 2 ? (
        <p className="text-sm text-white/30">Ketik minimal 2 karakter</p>
      ) : isLoading ? (
        <GridSkeleton />
      ) : data?.data?.length ? (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
          {data.data.map((item) => (
            <ContentCard
              key={item.slug}
              item={item}
              href={`/moviebox/${encodeURIComponent(item.slug ?? "")}`}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-white/30">
          Tidak ada hasil untuk &quot;{debounced}&quot;
        </p>
      )}
    </div>
  );
}

export default function MovieboxSearchPage() {
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
