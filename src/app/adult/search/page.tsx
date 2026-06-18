"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { fetchAdultSearch } from "@/lib/api";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import ContentCard from "@/components/sections/ContentCard";
import { GridSkeleton } from "@/components/ui/Skeleton";
import { Spinner } from "@/components/ui/Spinner";

const AGE_KEY = "godenstream_age_ok";

const TYPES = [
  { value: "west", label: "West" },
  { value: "indonesia", label: "Indonesia" },
];

function SearchContent() {
  const sp = useSearchParams();
  const [ok, setOk] = useState<boolean | null>(null);
  const [query, setQuery] = useState(sp.get("q") || "");
  const [debounced, setDebounced] = useState(sp.get("q") || "");
  const [type, setType] = useState("west");

  useEffect(() => {
    setOk(localStorage.getItem(AGE_KEY) === "1");
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 400);
    return () => clearTimeout(t);
  }, [query]);

  const { data, isLoading } = useQuery({
    queryKey: ["adult-search", debounced, type],
    queryFn: () => fetchAdultSearch(debounced, 1, type),
    enabled: ok === true && debounced.length >= 2,
  });

  if (ok === null) return null;
  if (!ok) {
    return (
      <p className="mx-auto max-w-md py-20 text-center text-sm text-white/50">
        Sahkan umur 18+ di /adult dahulu.
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
      <h1
        className="mb-6 text-2xl font-bold"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Search Adult
      </h1>

      <div className="relative mb-6 max-w-lg">
        <MagnifyingGlassIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/30" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-12 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] pl-12 pr-4 text-sm text-white placeholder:text-white/25 focus:border-white/20 focus:outline-none"
          placeholder="Cari…"
          autoFocus
        />
      </div>

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

      {debounced.length < 2 ? (
        <p className="text-sm text-white/30">Ketik minimal 2 karakter</p>
      ) : isLoading ? (
        <GridSkeleton />
      ) : data?.data?.length ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6">
          {data.data.map((item) => {
            const key = item.slug ?? item.video_id ?? "";
            return (
              <ContentCard
                key={key}
                item={item}
                href={`/adult/${encodeURIComponent(key)}?type=${encodeURIComponent(type)}`}
              />
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-white/30">
          Tidak ada hasil untuk &quot;{debounced}&quot;
        </p>
      )}
    </div>
  );
}

export default function AdultSearchPage() {
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
