"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchShordramaSort, getShordramaHref } from "@/lib/api";
import ContentCard from "@/components/sections/ContentCard";
import { GridSkeleton } from "@/components/ui/Skeleton";

export default function PopularPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["shordrama-sort", "popular"],
    queryFn: () => fetchShordramaSort("popular", 1, 30),
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <h1
        className="mb-2 text-3xl font-bold text-white md:text-4xl"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Popular
      </h1>
      <p className="mb-6 text-sm text-white/45">
        Drama paling populer dari Drama-ID, DramaBox, Melolo, NetShort, dan DramaNova.
      </p>

      {isLoading ? (
        <GridSkeleton />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6">
          {data?.data.map((drama, index) => (
            <ContentCard
              key={`${drama.provider_slug}-${drama.id}-${index}`}
              item={drama}
              href={getShordramaHref(drama)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
