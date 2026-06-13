"use client";

import { useEffect, useRef } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import type { PaginatedResponse } from "@/types";
import { GridSkeleton } from "@/components/ui/Skeleton";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorState } from "@/components/ui/ErrorState";
import ContentCard from "./ContentCard";

interface InfiniteGridProps {
  queryKey: string[];
  queryFn: (page: number) => Promise<PaginatedResponse<{
    id: number | string;
    title?: string;
    name?: string;
    cover_url?: string | null;
    provider_name?: string;
    chapter_count?: number | null;
    available_episodes?: number;
    play_count?: number;
  }>>;
  hrefPrefix: string;
  /** Optional override for building the per-card href (e.g. to add ?type=). */
  buildHref?: (key: string, item: unknown) => string;
  enabled?: boolean;
  emptyMessage?: string;
}

export default function InfiniteGrid({
  queryKey,
  queryFn,
  hrefPrefix,
  buildHref,
  enabled = true,
  emptyMessage = "No content found",
}: InfiniteGridProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch,
  } = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam = 1 }) => queryFn(pageParam),
    getNextPageParam: (lastPage) =>
      lastPage.meta.page < lastPage.meta.total_pages
        ? lastPage.meta.page + 1
        : undefined,
    initialPageParam: 1,
    enabled,
  });

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "400px" },
    );

    obs.observe(sentinel);
    return () => obs.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  if (isLoading) return <GridSkeleton />;

  if (isError) {
    return (
      <ErrorState
        message={error?.message || "Gagal memuat data."}
        retry={() => refetch()}
      />
    );
  }

  const items = data?.pages.flatMap((p) => p.data) ?? [];

  if (items.length === 0) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm text-white/30">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
        {items.map((item) => {
          const key =
            (item as { slug?: string }).slug ?? String(item.id ?? "");
          const href = buildHref
            ? buildHref(key, item)
            : `${hrefPrefix}/${encodeURIComponent(key)}`;
          return (
            <ContentCard
              key={key}
              item={item}
              href={href}
            />
          );
        })}
      </div>
      <div ref={sentinelRef} className="flex justify-center py-8">
        {isFetchingNextPage && <Spinner />}
      </div>
    </>
  );
}
