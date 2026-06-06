"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchDracinLatest } from "@/lib/api";
import ContentCard from "@/components/sections/ContentCard";
import ContinueWatching from "@/components/sections/ContinueWatching";
import SwipeCarousel from "@/components/sections/SwipeCarousel";
import { GridSkeleton } from "@/components/ui/Skeleton";

export default function DramaHomePage() {
  const { data: p1, isLoading } = useQuery({
    queryKey: ["dracin-latest", 1],
    queryFn: () => fetchDracinLatest(1),
  });

  const { data: p2 } = useQuery({
    queryKey: ["dracin-latest", 2],
    queryFn: () => fetchDracinLatest(2),
  });

  const carousel = p1?.data ?? [];
  const grid = [...(p1?.data ?? []), ...(p2?.data ?? [])];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
      <ContinueWatching section="drama" />

      <SwipeCarousel
        title="Drama Terbaru"
        viewAllHref="/drama/browse"
        accentColor="gold"
      >
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="w-28 shrink-0 sm:w-32">
                <div className="skeleton aspect-[3/4] rounded-xl" />
              </div>
            ))
          : carousel.map((item) => (
              <div
                key={item.slug}
                className="w-28 shrink-0 sm:w-32"
              >
                <ContentCard
                  item={item}
                  href={`/drama/${encodeURIComponent(item.slug ?? "")}`}
                />
              </div>
            ))}
      </SwipeCarousel>

      <section className="mt-8">
        <h2 className="mb-4 text-base font-semibold text-white">Latest</h2>
        {isLoading ? (
          <GridSkeleton />
        ) : (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
            {grid.map((item) => (
              <ContentCard
                key={item.slug}
                item={item}
                href={`/drama/${encodeURIComponent(item.slug ?? "")}`}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
