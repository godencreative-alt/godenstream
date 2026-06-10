"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { FilmIcon } from "@heroicons/react/24/solid";
import {
  fetchMovieDetail,
  pickBestVideoUrl,
  pickEmbedUrl,
} from "@/lib/api";
import { providerBadgeColor } from "@/lib/utils";
import { saveLocalProgress } from "@/lib/local-history";
import VideoPlayer from "@/components/player/VideoPlayer";
import SafeEmbed from "@/components/player/SafeEmbed";
import { Spinner } from "@/components/ui/Spinner";

export default function MovieboxDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const { data, isLoading } = useQuery({
    queryKey: ["movie-detail", id],
    queryFn: () => fetchMovieDetail(id),
  });

  const movie = data?.data;

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-white/40">Movie not found</p>
      </div>
    );
  }

  const sources = movie.sources ?? [];
  const videoUrl = pickBestVideoUrl(sources);
  const embedUrl = pickEmbedUrl(sources);
  const qualities = Object.fromEntries(
    sources
      .filter((s) => (s.type === "hls" || s.type === "mp4") && s.url)
      .map((s) => [s.quality || s.type, s.url]),
  );
  const infoEntries = Object.entries(movie.info || {});

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
      <div className="mb-6">
        {videoUrl ? (
          <VideoPlayer
            src={videoUrl}
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
                src={movie.thumbnail}
                alt={movie.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-[var(--dc-elevated)]">
                <FilmIcon className="h-12 w-12 text-white/20" />
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 space-y-4">
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

          {infoEntries.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 text-[12px] text-white/40">
              {infoEntries.slice(0, 8).map(([key, value]) => (
                <span key={key}>
                  <span className="capitalize text-white/30">{key}:</span>{" "}
                  {value}
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
