"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchAnimePopular, fetchAnimeList } from "@/lib/api";
import ContentCard from "@/components/sections/ContentCard";
import SwipeCarousel from "@/components/sections/SwipeCarousel";
import { GridSkeleton } from "@/components/ui/Skeleton";

export default function AnimeHomePage() {
  const { data: popular, isLoading: pl } = useQuery({
    queryKey: ["anime-popular"],
    queryFn: () => fetchAnimePopular({ per_page: 16 }),
  });

  const { data: latest, isLoading: ll } = useQuery({
    queryKey: ["anime-latest"],
    queryFn: () => fetchAnimeList({ per_page: 24, sort_by: "updated_at" }),
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
      <SwipeCarousel title="Popular Anime" viewAllHref="/anime/popular" accentColor="violet">
        {pl
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="w-28 shrink-0 sm:w-32"><div className="skeleton aspect-[3/4] rounded-xl" /></div>
            ))
          : popular?.data.map((item) => (
              <div key={item.id} className="w-28 shrink-0 sm:w-32">
                <ContentCard item={item} href={`/anime/${item.id}`} />
              </div>
            ))}
      </SwipeCarousel>

      <section>
        <h2 className="mb-4 text-base font-semibold text-white">Latest</h2>
        {ll ? <GridSkeleton /> : (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
            {latest?.data.map((item) => (
              <ContentCard key={item.id} item={item} href={`/anime/${item.id}`} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
