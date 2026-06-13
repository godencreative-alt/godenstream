"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import {
  PlayIcon,
  BookmarkIcon,
  FilmIcon,
} from "@heroicons/react/24/solid";
import {
  BookmarkIcon as BookmarkOutline,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { fetchDracinDetail } from "@/lib/api";
import { isLocalBookmarked, toggleLocalBookmark } from "@/lib/local-history";
import { truncateText, providerBadgeColor, proxyThumbnail } from "@/lib/utils";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorState } from "@/components/ui/ErrorState";

export default function DramaDetailClient({ id }: { id: string }) {
  const [bookmarked, setBookmarked] = useState(() =>
    typeof window !== "undefined" ? isLocalBookmarked(id) : false,
  );
  const [showFullDesc, setShowFullDesc] = useState(false);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["dracin-detail", id],
    queryFn: () => fetchDracinDetail(id),
  });

  const drama = data?.data;

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError) return <ErrorState message={error?.message} retry={() => refetch()} />;

  if (!drama) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-white/40">Drama not found</p>
      </div>
    );
  }

  const description = drama.description || "";
  const firstEpisode = drama.episodes?.[0];
  const infoEntries = Object.entries(drama.info || {});

  function handleBookmark() {
    if (!drama) return;
    toggleLocalBookmark({
      id: drama.slug,
      title: drama.title,
      cover_url: drama.thumbnail,
      provider_name: drama.source,
      chapter_count: drama.episodes?.length ?? null,
    });
    setBookmarked(!bookmarked);
  }

  return (
    <div className="relative">
      <div className="relative mx-auto max-w-7xl px-4 py-8 md:px-6">
        <div className="flex flex-col gap-6 md:flex-row md:gap-8">
          <div className="w-48 shrink-0 self-center md:w-56 md:self-start">
            <div className="relative aspect-[3/4] overflow-hidden rounded-2xl shadow-2xl">
              {drama.thumbnail ? (
                <Image
                  src={proxyThumbnail(drama.thumbnail) ?? drama.thumbnail}
                  alt={drama.title}
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
            <div>
              {drama.source && (
                <span
                  className={`mb-2 inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${providerBadgeColor(drama.source)}`}
                >
                  {drama.source}
                </span>
              )}
              <h1
                className="text-2xl font-bold md:text-3xl"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {drama.title}
              </h1>
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

            {description && (
              <div>
                <p className="text-sm leading-relaxed text-white/50">
                  {showFullDesc ? description : truncateText(description, 240)}
                </p>
                {description.length > 240 && (
                  <button
                    onClick={() => setShowFullDesc(!showFullDesc)}
                    className="mt-1 flex items-center gap-1 text-[11px] text-white/30 hover:text-white/50"
                  >
                    {showFullDesc ? "Show less" : "Show more"}
                    <ChevronDownIcon
                      className={`h-3 w-3 transition-transform ${showFullDesc ? "rotate-180" : ""}`}
                    />
                  </button>
                )}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              {firstEpisode && (
                <Link
                  href={`/drama/${encodeURIComponent(id)}/${encodeURIComponent(firstEpisode.slug)}`}
                  className="inline-flex items-center gap-2 rounded-xl bg-[var(--dc-gold)] px-5 py-2.5 text-sm font-semibold text-zinc-900 hover:brightness-110"
                >
                  <PlayIcon className="h-4 w-4" />
                  Watch First Episode
                </Link>
              )}
              <button
                onClick={handleBookmark}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/70 hover:border-white/20 hover:text-white"
              >
                {bookmarked ? (
                  <BookmarkIcon className="h-4 w-4 text-[var(--dc-gold)]" />
                ) : (
                  <BookmarkOutline className="h-4 w-4" />
                )}
                {bookmarked ? "Saved" : "Save"}
              </button>
            </div>
          </div>
        </div>

        {drama.episodes && drama.episodes.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-4 text-lg font-semibold">Episodes</h2>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {drama.episodes.map((ep) => (
                <Link
                  key={ep.slug}
                  href={`/drama/${encodeURIComponent(id)}/${encodeURIComponent(ep.slug)}`}
                  className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-sm text-white/70 transition-colors hover:border-[var(--dc-gold)]/30 hover:bg-[var(--dc-gold)]/5 hover:text-white"
                >
                  {ep.title}
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
