"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  ArrowLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import {
  fetchAnimeDetail,
  fetchAnimeEpisodes,
  fetchAnimeEpisodeSources,
  pickBestVideoUrl,
  pickEmbedUrl,
} from "@/lib/api";
import { saveLocalProgress } from "@/lib/local-history";
import VideoPlayer from "@/components/player/VideoPlayer";
import SafeEmbed from "@/components/player/SafeEmbed";
import { Spinner } from "@/components/ui/Spinner";

export default function AnimeEpisodePage({
  params,
}: {
  params: Promise<{ id: string; episode: string }>;
}) {
  const { id, episode } = use(params);

  const { data: animeData } = useQuery({
    queryKey: ["anime-detail", id],
    queryFn: () => fetchAnimeDetail(id),
  });

  const { data: epListData } = useQuery({
    queryKey: ["anime-episodes", id],
    queryFn: () => fetchAnimeEpisodes(id),
  });

  const { data: sourceData, isLoading, error } = useQuery({
    queryKey: ["anime-episode-sources", episode],
    queryFn: () => fetchAnimeEpisodeSources(episode),
    retry: 1,
  });

  const anime = animeData?.data;
  const episodes = epListData?.data ?? [];
  const sources = sourceData?.data?.sources ?? [];
  const currentIndex = episodes.findIndex((e) => e.slug === episode);
  const prevEp = currentIndex > 0 ? episodes[currentIndex - 1] : null;
  const nextEp = currentIndex >= 0 ? episodes[currentIndex + 1] : null;
  const currentEp = currentIndex >= 0 ? episodes[currentIndex] : null;

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const videoUrl = pickBestVideoUrl(sources);
  const embedUrl = pickEmbedUrl(sources);
  const qualities = Object.fromEntries(
    sources
      .filter((s) => (s.type === "hls" || s.type === "mp4") && s.url)
      .map((s) => [s.quality || s.type, s.url]),
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-6">
      <div className="mb-4 flex items-center justify-between">
        <Link
          href={`/anime/${encodeURIComponent(id)}`}
          className="flex items-center gap-2 text-sm text-white/50 hover:text-white"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          {anime?.title || "Back"}
        </Link>
        <div className="flex items-center gap-2">
          {prevEp && (
            <Link
              href={`/anime/${encodeURIComponent(id)}/${encodeURIComponent(prevEp.slug)}`}
              className="rounded-lg p-2 text-white/40 hover:bg-white/[0.05] hover:text-white"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </Link>
          )}
          <span className="text-sm text-white/60">Episode</span>
          {nextEp && (
            <Link
              href={`/anime/${encodeURIComponent(id)}/${encodeURIComponent(nextEp.slug)}`}
              className="rounded-lg p-2 text-white/40 hover:bg-white/[0.05] hover:text-white"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>

      {videoUrl ? (
        <VideoPlayer
          src={videoUrl}
          qualities={Object.keys(qualities).length > 0 ? qualities : null}
          isLandscape
          accentColor="var(--dc-violet)"
          onProgress={(progress, duration) => {
            saveLocalProgress({
              content_id: id,
              content_name: anime?.title || "",
              cover_url: anime?.thumbnail || null,
              episode_number: Math.max(currentIndex + 1, 1),
              episode_slug: episode,
              progress_seconds: progress,
              duration_seconds: duration,
              completed: duration > 0 ? progress / duration > 0.9 : false,
            });
          }}
          onEnded={() => {
            if (nextEp) {
              window.location.href = `/anime/${encodeURIComponent(id)}/${encodeURIComponent(nextEp.slug)}`;
            }
          }}
        />
      ) : embedUrl ? (
        <SafeEmbed src={embedUrl} title={sourceData?.data?.title || "Anime player"} />
      ) : (
        <div className="flex aspect-video items-center justify-center rounded-2xl bg-[var(--dc-elevated)]">
          <p className="text-sm text-white/30">
            {error ? "Gagal memuatkan video. Cuba lagi." : "Video tidak tersedia"}
          </p>
        </div>
      )}

      <div className="mt-4">
        <h1 className="text-lg font-bold">
          {anime?.title || "Anime"}
        </h1>
        {currentEp?.title && (
          <p className="mt-1 text-sm text-white/50">{currentEp.title}</p>
        )}
      </div>

      {episodes.length > 1 && (
        <div className="mt-6">
          <h3 className="mb-3 text-sm font-semibold text-white/60">
            All Episodes
          </h3>
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
            {episodes.map((ep) => (
              <Link
                key={ep.slug}
                href={`/anime/${encodeURIComponent(id)}/${encodeURIComponent(ep.slug)}`}
                className={`rounded-lg px-3 py-2 text-[12px] font-medium transition-colors ${
                  ep.slug === episode
                    ? "bg-[var(--dc-violet)]/15 text-[var(--dc-violet)]"
                    : "border border-white/[0.06] text-white/40 hover:text-white/60"
                }`}
              >
                {ep.title}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
