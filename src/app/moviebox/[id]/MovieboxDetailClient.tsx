"use client";

import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { FilmIcon, BookmarkIcon as BookmarkOutlineIcon } from "@heroicons/react/24/outline";
import { BookmarkIcon as BookmarkSolidIcon } from "@heroicons/react/24/solid";
import {
  fetchMovieDetail,
  fetchMovieSources,
  fetchVaultResolve,
  pickPlayback,
  pickEmbedUrl,
  pickVaultPlayback,
} from "@/lib/api";
import { providerBadgeColor, proxyThumbnail } from "@/lib/utils";
import { saveLocalProgress, isLocalBookmarked, toggleLocalBookmark } from "@/lib/local-history";
import VideoPlayer from "@/components/player/VideoPlayer";
import SafeEmbed from "@/components/player/SafeEmbed";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorState } from "@/components/ui/ErrorState";
import { useState, useEffect, useCallback } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function MovieboxDetailClient({ id }: { id: string }) {
  const [bookmarked, setBookmarked] = useState(false);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["movie-detail", id],
    queryFn: () => fetchMovieDetail(id),
    staleTime: 60_000,
  });

  const { data: sourcesData } = useQuery({
    queryKey: ["movie-sources", id],
    queryFn: () => fetchMovieSources(id),
    enabled: !!data?.data,
  });

  const { data: vaultData } = useQuery({
    queryKey: ["vault-resolve", "movie", id],
    queryFn: () => fetchVaultResolve({ category: "movie", slug: id, kind: "video" }),
    enabled: data?.data?.in_vault === true,
  });

  const movie = data?.data;

  useEffect(() => {
    if (movie) setBookmarked(isLocalBookmarked(`moviebox:${id}`));
  }, [movie, id]);

  const handleBookmark = useCallback(() => {
    if (!movie) return;
    const nowBookmarked = toggleLocalBookmark({
      id: `moviebox:${id}`,
      section: "moviebox",
      slug: id,
      title: movie.title,
      thumbnail: movie.thumbnail || null,
    });
    setBookmarked(nowBookmarked);
  }, [movie, id]);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError) return <ErrorState message={error?.message} retry={() => refetch()} />;

  if (!movie) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-white/40">Movie not found</p>
      </div>
    );
  }

  const sources = sourcesData?.data?.sources?.length
    ? sourcesData.data.sources
    : movie.sources ?? [];
  const vaultPlayback = pickVaultPlayback(vaultData);
  const preferEmbed = (movie as any).playback?.preferred === "embed";
  const regularPlayback = preferEmbed
    ? { src: null as string | null, sourceType: undefined, qualities: {} as Record<string, string> }
    : pickPlayback(sources);
  const videoUrl = vaultPlayback.src ?? regularPlayback.src;
  const videoType = vaultPlayback.src ? vaultPlayback.sourceType : regularPlayback.sourceType;
  const qualities = vaultPlayback.src ? vaultPlayback.qualities : regularPlayback.qualities;
  const embedUrl = vaultPlayback.src ? null : pickEmbedUrl(sources);
  const infoEntries = Object.entries(movie.info || {});

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
      <div className="mb-6">
        {videoUrl ? (
          <VideoPlayer
            src={videoUrl}
            sourceType={videoType}
            qualities={Object.keys(qualities).length > 0 ? qualities : null}
            isLandscape
            accentColor="var(--dc-orange)"
            onProgress={(progress, duration) => {
              saveLocalProgress({
                content_id: id,
                content_name: movie.title,
                cover_url: movie.thumbnail || null,
                episode_number: 1,
                episode_slug: id,
                progress_seconds: progress,
                duration_seconds: duration,
                completed: duration > 0 ? progress / duration > 0.9 : false,
              });
            }}
          />
        ) : embedUrl ? (
          <SafeEmbed src={embedUrl} title={movie.title} />
        ) : (
          <div className="flex aspect-video items-center justify-center rounded-2xl bg-[var(--dc-elevated)]">
            <p className="text-sm text-white/30">Video not available</p>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-6 md:flex-row md:gap-8">
        <div className="w-40 shrink-0 self-center md:self-start">
          <div className="relative aspect-[3/4] overflow-hidden rounded-2xl shadow-2xl">
            {movie.thumbnail ? (
              <Image
                src={proxyThumbnail(movie.thumbnail) ?? movie.thumbnail}
                alt={movie.title}
                fill
                className="object-cover"
                unoptimized={!!(proxyThumbnail(movie.thumbnail)?.startsWith("/api/"))}
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
            <div className="space-y-2">
              {movie.source && (
                <span
                  className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${providerBadgeColor(movie.source)}`}
                >
                  {movie.source}
                </span>
              )}
              <h1
                className="text-2xl font-bold md:text-3xl"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {movie.title}
              </h1>
            </div>
            <button
              onClick={handleBookmark}
              className="shrink-0 rounded-xl border border-white/[0.08] p-2 text-white/40 transition-colors hover:border-[var(--dc-orange)]/30 hover:text-[var(--dc-orange)]"
              aria-label={bookmarked ? "Remove bookmark" : "Add bookmark"}
            >
              {bookmarked ? (
                <BookmarkSolidIcon className="h-5 w-5 text-[var(--dc-orange)]" />
              ) : (
                <BookmarkOutlineIcon className="h-5 w-5" />
              )}
            </button>
          </div>

          {infoEntries.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 text-[12px] text-white/40">
              {infoEntries.slice(0, 8).map(([key, value]) => (
                <span key={key}>
                  <span className="capitalize text-white/30">{key}:</span>{" "}
                  {String(value)}
                </span>
              ))}
            </div>
          )}

          {movie.description && (
            <p className="text-sm leading-relaxed text-white/50">
              {movie.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
