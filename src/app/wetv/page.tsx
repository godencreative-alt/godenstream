"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchWetvList } from "@/lib/api";
import ContentCard from "@/components/sections/ContentCard";
import SwipeCarousel from "@/components/sections/SwipeCarousel";
import { GridSkeleton } from "@/components/ui/Skeleton";

export default function WetvHomePage() {
  const { data, isLoading } = useQuery({ queryKey: ["wetv-home"], queryFn: () => fetchWetvList({ per_page: 24, sort_by: "play_count" }) });

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
      <SwipeCarousel title="Popular on WeTV" viewAllHref="/wetv/popular" accentColor="rose">
        {isLoading ? Array.from({ length: 8 }).map((_, i) => <div key={i} className="w-28 shrink-0 sm:w-32"><div className="skeleton aspect-[3/4] rounded-xl" /></div>)
          : data?.data.slice(0, 12).map((item) => <div key={item.id} className="w-28 shrink-0 sm:w-32"><ContentCard item={item} href={`/wetv/${item.id}`} /></div>)}
      </SwipeCarousel>
      <section>
        <h2 className="mb-4 text-base font-semibold text-white">Latest</h2>
        {isLoading ? <GridSkeleton /> : (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
            {data?.data.map((item) => <ContentCard key={item.id} item={item} href={`/wetv/${item.id}`} />)}
          </div>
        )}
      </section>
    </div>
  );
}
