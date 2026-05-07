"use client";

import { useMemo, useState } from "react";
import { notFound, useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  fetchShordramaPlatformList,
  getShordramaPlatform,
  type ShordramaSort,
} from "@/lib/api";
import ContentCard from "@/components/sections/ContentCard";
import { GridSkeleton } from "@/components/ui/Skeleton";

const sorts: { value: ShordramaSort; label: string }[] = [
  { value: "trending", label: "Trending" },
  { value: "popular", label: "Popular" },
  { value: "latest", label: "Terbaru" },
];

export default function PlatformPage() {
  const params = useParams<{ platform: string }>();
  const platform = useMemo(
    () => getShordramaPlatform(params.platform),
    [params.platform],
  );
  const [sort, setSort] = useState<ShordramaSort>("latest");

  const { data, isLoading } = useQuery({
    queryKey: ["platform", params.platform, sort],
    queryFn: () =>
      fetchShordramaPlatformList({
        platform: params.platform,
        sort,
        page: 1,
        per_page: 30,
      }),
    enabled: Boolean(platform),
  });

  if (!platform) notFound();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.3em] text-[var(--dc-gold)]">
            Shordrama
          </p>
          <h1
            className="text-3xl font-bold text-white md:text-4xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {platform.name}
          </h1>
          <p className="mt-2 text-sm text-white/45">
            Semua drama dari platform {platform.name}.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {sorts.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setSort(item.value)}
              className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                sort === item.value
                  ? "bg-[var(--dc-gold)] text-black"
                  : "border border-white/[0.08] text-white/45 hover:text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <GridSkeleton />
      ) : data?.data.length ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6">
          {data.data.map((drama, index) => (
            <ContentCard
              key={`${platform.slug}-${drama.id}-${index}`}
              item={drama}
              href={`/platform/${platform.slug}`}
            />
          ))}
        </div>
      ) : (
        <div className="flex min-h-[40vh] items-center justify-center rounded-2xl border border-white/[0.06]">
          <p className="text-sm text-white/35">
            Konten {platform.name} belum tersedia.
          </p>
        </div>
      )}
    </div>
  );
}
