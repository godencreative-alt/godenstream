"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { PlayIcon, FilmIcon, BookmarkIcon as BookmarkOutlineIcon } from "@heroicons/react/24/outline";
import { BookmarkIcon as BookmarkSolidIcon } from "@heroicons/react/24/solid";
import { fetchDonghuaDetail, fetchDonghuaEpisodes } from "@/lib/api";
import { proxyThumbnail } from "@/lib/utils";
import { isLocalBookmarked, toggleLocalBookmark } from "@/lib/local-history";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorState } from "@/components/ui/ErrorState";
import { useState, useEffect, useCallback } from "react";

export default function DonghuaDetailClient({ id, source }: { id: string; source?: string }) {
  const [bookmarked, setBookmarked] = useState(false);

  const { data: detail, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["donghua-detail", id],
    queryFn: () => fetchDonghuaDetail(id, source),
  });

  const { data: epList } = useQuery({
    queryKey: ["donghua-episodes", id],
    queryFn: () => fetchDonghuaEpisodes(id, source),
  });

  const item = detail?.data;
  const episodes = epList?.data ?? item?.episodes ?? [];

  useEffect(() => {
    if (item) setBookmarked(isLocalBookmarked(`donghua:${id}`));
  }, [item, id]);

  const handleBookmark = useCallback(() => {
    if (!item) return;
    const nowBookmarked = toggleLocalBookmark({
      id: `donghua:${id}`,
      section: "donghua",
      slug: id,
      title: item.title,
      thumbnail: item.thumbnail || null,
    });
    setBookmarked(nowBookmarked);
  }, [item, id]);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError) return <ErrorState message={error?.message} retry={() => refetch()} />;

  if (!item) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-white/40">Donghua tidak ditemukan</p>
      </div>
    );
  }

  const firstEp = episodes[0];
  const infoEntries = Object.entries(item.info || {});

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <div className="flex flex-col gap-6 md:flex-row md:gap-8">
        <div className="w-48 shrink-0 self-center md:w-56 md:self-start">
          <div className="relative aspect-[3/4] overflow-hidden rounded-2xl shadow-2xl">
            {item.thumbnail ? (
              <Image
                src={proxyThumbnail(item.thumbnail) ?? item.thumbnail}
                alt={item.title}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-[var(--dc-elevated)]">
                <FilmIcon className="h-12 w-12 text-white/20" />
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <h1
              className="text-2xl font-bold md:text-3xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {item.title}
            </h1>
            <button
              onClick={handleBookmark}
              className="shrink-0 rounded-xl border border-white/[0.08] p-2 text-white/40 transition-colors hover:border-[var(--dc-cyan)]/30 hover:text-[var(--dc-cyan)]"
              aria-label={bookmarked ? "Remove bookmark" : "Add bookmark"}
            >
              {bookmarked ? (
                <BookmarkSolidIcon className="h-5 w-5 text-[var(--dc-cyan)]" />
              ) : (
                <BookmarkOutlineIcon className="h-5 w-5" />
              )}
            </button>
          </div>

          {infoEntries.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 text-[12px] text-white/40">
              {infoEntries.slice(0, 6).map(([key, value]) => (
                <span key={key}>
                  <span className="capitalize text-white/30">{key}:</span>{" "}
                  {value}
                </span>
              ))}
            </div>
          )}

          {item.description && (
            <p className="text-sm leading-relaxed text-white/50">
              {item.description}
            </p>
          )}

          {firstEp && (
            <Link
              href={`/donghua/${encodeURIComponent(id)}/${encodeURIComponent(firstEp.slug)}${source ? `?source=${encodeURIComponent(source)}` : ""}`}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--dc-cyan)] px-5 py-2.5 text-sm font-semibold text-zinc-900 hover:brightness-110"
            >
              <PlayIcon className="h-4 w-4" />
              Tonton Episode Pertama
            </Link>
          )}
        </div>
      </div>

      {episodes.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-lg font-semibold">Episodes</h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {episodes.map((ep) => (
              <Link
                key={ep.slug}
                href={`/donghua/${encodeURIComponent(id)}/${encodeURIComponent(ep.slug)}${source ? `?source=${encodeURIComponent(source)}` : ""}`}
                className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-sm text-white/70 transition-colors hover:border-[var(--dc-cyan)]/30 hover:bg-[var(--dc-cyan)]/5 hover:text-white"
              >
                {ep.title}
                {ep.date && (
                  <span className="ml-2 text-[10px] text-white/30">
                    {ep.date}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
