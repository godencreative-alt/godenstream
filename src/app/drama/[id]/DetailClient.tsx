"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { PlayIcon, BookmarkIcon, FilmIcon } from "@heroicons/react/24/solid";
import { BookmarkIcon as BookmarkOutline, ChevronDownIcon } from "@heroicons/react/24/outline";
import { fetchDramaDetail, fetchDramaEpisodes } from "@/lib/api";
import { isLocalBookmarked, toggleLocalBookmark } from "@/lib/local-history";
import { formatPlayCount, truncateText, providerBadgeColor } from "@/lib/utils";
import { Spinner } from "@/components/ui/Spinner";

export default function DramaDetailClient({ id }: { id: string }) {
  const [bookmarked, setBookmarked] = useState(() =>
    typeof window !== "undefined" ? isLocalBookmarked(id) : false,
  );
  const [showFullDesc, setShowFullDesc] = useState(false);

  const { data: drama, isLoading } = useQuery({
    queryKey: ["drama-detail", id],
    queryFn: () => fetchDramaDetail(id),
  });

  const { data: episodes } = useQuery({
    queryKey: ["drama-episodes", id],
    queryFn: () => fetchDramaEpisodes(id),
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!drama) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-white/40">Drama not found</p>
      </div>
    );
  }

  const tmdb = drama.raw_data?.tmdb;
  const posterUrl =
    tmdb?.poster_path
      ? `https://image.tmdb.org/t/p/w500${tmdb.poster_path}`
      : drama.cover_url;
  const backdropUrl = tmdb?.backdrop_path
    ? `https://image.tmdb.org/t/p/w1280${tmdb.backdrop_path}`
    : null;
  const description = tmdb?.overview || drama.introduction || "";

  function handleBookmark() {
    toggleLocalBookmark({
      id: String(drama!.id),
      title: drama!.title,
      cover_url: drama!.cover_url,
      provider_name: drama!.provider_name,
      chapter_count: drama!.chapter_count,
    });
    setBookmarked(!bookmarked);
  }

  return (
    <div className="relative">
      {/* Backdrop */}
      {backdropUrl && (
        <div className="absolute inset-0 h-[400px] overflow-hidden">
          <Image
            src={backdropUrl}
            alt=""
            fill
            className="object-cover opacity-20 blur-sm"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--dc-base)]/80 to-[var(--dc-base)]" />
        </div>
      )}

      <div className="relative mx-auto max-w-7xl px-4 py-8 md:px-6">
        <div className="flex flex-col gap-6 md:flex-row md:gap-8">
          {/* Poster */}
          <div className="w-48 shrink-0 self-center md:w-56 md:self-start">
            <div className="relative aspect-[3/4] overflow-hidden rounded-2xl shadow-2xl">
              {posterUrl ? (
                <Image
                  src={posterUrl}
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

          {/* Info */}
          <div className="flex-1 space-y-4">
            <div>
              {drama.provider_name && (
                <span
                  className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium mb-2 ${providerBadgeColor(drama.provider_name)}`}
                >
                  {drama.provider_name}
                </span>
              )}
              <h1 className="text-2xl font-bold md:text-3xl" style={{ fontFamily: "var(--font-display)" }}>
                {drama.title}
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-[12px] text-white/40">
              {tmdb?.vote_average && (
                <span className="text-[var(--dc-gold)]">
                  ★ {tmdb.vote_average.toFixed(1)}
                </span>
              )}
              {drama.chapter_count && <span>{drama.chapter_count} Episodes</span>}
              {drama.play_count > 0 && (
                <span>{formatPlayCount(drama.play_count)} views</span>
              )}
              {tmdb?.release_date && (
                <span>{new Date(tmdb.release_date).getFullYear()}</span>
              )}
              {drama.language && <span>{drama.language}</span>}
            </div>

            {tmdb?.genres && tmdb.genres.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tmdb.genres.map((g) => (
                  <span
                    key={g.name}
                    className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-2.5 py-1 text-[11px] text-white/40"
                  >
                    {g.name}
                  </span>
                ))}
              </div>
            )}

            {description && (
              <div>
                <p className="text-sm leading-relaxed text-white/50">
                  {showFullDesc
                    ? description
                    : truncateText(description, 200)}
                </p>
                {description.length > 200 && (
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
              {episodes?.data?.[0] && (
                <Link
                  href={`/drama/${id}/${episodes.data[0].episode_index}`}
                  className="inline-flex items-center gap-2 rounded-xl bg-[var(--dc-gold)] px-5 py-2.5 text-sm font-semibold text-zinc-900 hover:brightness-110"
                >
                  <PlayIcon className="h-4 w-4" />
                  Watch EP 1
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

        {/* Episode grid */}
        {episodes?.data && episodes.data.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-4 text-lg font-semibold">Episodes</h2>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10">
              {episodes.data.map((ep) => (
                <Link
                  key={ep.id}
                  href={`/drama/${id}/${ep.episode_index}`}
                  className="flex items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.02] py-3 text-[13px] font-medium text-white/60 transition-colors hover:border-[var(--dc-gold)]/30 hover:bg-[var(--dc-gold)]/5 hover:text-[var(--dc-gold)]"
                >
                  {ep.episode_index}
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
