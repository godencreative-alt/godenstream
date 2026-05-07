"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchDramaTrending, fetchDramaPopular } from "@/lib/api";
import ContentCard from "@/components/sections/ContentCard";
import SwipeCarousel from "@/components/sections/SwipeCarousel";
import ContinueWatching from "@/components/sections/ContinueWatching";
import { GridSkeleton } from "@/components/ui/Skeleton";

export default function DramaHomePage() {
  const { data: trending, isLoading: tl } = useQuery({
    queryKey: ["drama-trending"],
    queryFn: () => fetchDramaTrending({ per_page: 16 }),
  });

  const { data: popular, isLoading: pl } = useQuery({
    queryKey: ["drama-popular"],
    queryFn: () => fetchDramaPopular({ per_page: 16 }),
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
      <ContinueWatching section="drama" />

      <SwipeCarousel title="Trending Now" viewAllHref="/drama/popular" accentColor="gold">
        {tl
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="w-28 shrink-0 sm:w-32">
                <div className="skeleton aspect-[3/4] rounded-xl" />
              </div>
            ))
          : trending?.data.map((item) => (
              <div key={item.id} className="w-28 shrink-0 sm:w-32">
                <ContentCard item={item} href={`/drama/${item.id}`} />
              </div>
            ))}
      </SwipeCarousel>

      <SwipeCarousel title="Most Popular" viewAllHref="/drama/popular" accentColor="gold">
        {pl
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="w-28 shrink-0 sm:w-32">
                <div className="skeleton aspect-[3/4] rounded-xl" />
              </div>
            ))
          : popular?.data.map((item) => (
              <div key={item.id} className="w-28 shrink-0 sm:w-32">
                <ContentCard item={item} href={`/drama/${item.id}`} />
              </div>
            ))}
      </SwipeCarousel>

      <section>
        <h2 className="mb-4 text-base font-semibold text-white">Latest</h2>
        {tl ? (
          <GridSkeleton />
        ) : (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
            {trending?.data.map((item) => (
              <ContentCard key={item.id} item={item} href={`/drama/${item.id}`} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
