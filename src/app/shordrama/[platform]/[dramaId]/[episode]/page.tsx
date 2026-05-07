"use client";

import { use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeftIcon, ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import {
  fetchShordramaDetail,
  fetchShordramaVideo,
  getShordramaPlatform,
} from "@/lib/api";
import { saveLocalProgress } from "@/lib/local-history";
import VideoPlayer from "@/components/player/VideoPlayer";
import { Spinner } from "@/components/ui/Spinner";

export default function ShordramaEpisodePage({
  params,
}: {
  params: Promise<{ platform: string; dramaId: string; episode: string }>;
}) {
  const { platform, dramaId, episode } = use(params);
  const provider = getShordramaPlatform(platform);
  const episodeIndex = parseInt(episode, 10);

  const { data: drama } = useQuery({
    queryKey: ["shordrama-detail", platform, dramaId],
    queryFn: () => fetchShordramaDetail(platform, dramaId),
    enabled: Boolean(provider),
  });

  const { data: video, isLoading } = useQuery({
    queryKey: ["shordrama-video", platform, dramaId, episodeIndex],
    queryFn: () => fetchShordramaVideo(platform, dramaId, episodeIndex),
    enabled: Boolean(provider) && Number.isFinite(episodeIndex),
  });

  if (!provider || !Number.isFinite(episodeIndex)) notFound();

  const episodes = drama?.episodes || [];
  const currentEp =
    video?.episode || episodes.find((item) => item.episode_index === episodeIndex) || null;
  const prevEp = episodes.find((item) => item.episode_index === episodeIndex - 1);
  const nextEp = episodes.find((item) => item.episode_index === episodeIndex + 1);
  const videoSrc = video?.video_url || Object.values(video?.qualities || {})[0] || "";

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <Link
          href={`/shordrama/${provider.slug}/${encodeURIComponent(dramaId)}`}
          className="flex min-w-0 items-center gap-2 text-sm text-white/50 hover:text-white"
        >
          <ArrowLeftIcon className="h-4 w-4 shrink-0" />
          <span className="truncate">{drama?.title || provider.name}</span>
        </Link>
        <div className="flex shrink-0 items-center gap-2">
          {prevEp ? (
            <Link
              href={`/shordrama/${provider.slug}/${encodeURIComponent(dramaId)}/${prevEp.episode_index}`}
              className="rounded-lg p-2 text-white/40 hover:bg-white/[0.05] hover:text-white"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </Link>
          ) : null}
          <span className="text-sm text-white/60">EP {episodeIndex}</span>
          {nextEp ? (
            <Link
              href={`/shordrama/${provider.slug}/${encodeURIComponent(dramaId)}/${nextEp.episode_index}`}
              className="rounded-lg p-2 text-white/40 hover:bg-white/[0.05] hover:text-white"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </Link>
          ) : null}
        </div>
      </div>

      {videoSrc ? (
        <VideoPlayer
          src={videoSrc}
          qualities={video?.qualities}
          subtitleUrl={video?.subtitle_url}
          subtitles={video?.subtitles}
          isLandscape={false}
          accentColor="var(--dc-gold)"
          onProgress={(progress, duration) => {
            saveLocalProgress({
              content_id: `${provider.slug}:${dramaId}`,
              content_name: drama?.title || "",
              cover_url: drama?.cover_url || currentEp?.cover_url || null,
              episode_number: episodeIndex,
              progress_seconds: progress,
              duration_seconds: duration,
              completed: duration > 0 && progress / duration > 0.9,
            });
          }}
          onEnded={() => {
            if (nextEp) {
              window.location.href = `/shordrama/${provider.slug}/${encodeURIComponent(dramaId)}/${nextEp.episode_index}`;
            }
          }}
        />
      ) : (
        <div className="flex aspect-[9/16] max-h-[75vh] items-center justify-center rounded-2xl border border-white/[0.06] bg-[var(--dc-elevated)]">
          <div className="max-w-sm px-6 text-center">
            <p className="font-semibold text-white/60">Video belum tersedia</p>
            <p className="mt-2 text-sm text-white/35">
              API {provider.name} belum mengirim URL video untuk episode ini.
            </p>
          </div>
        </div>
      )}

      <div className="mt-4">
        <h1 className="text-lg font-bold">
          {drama?.title || provider.name} — EP {episodeIndex}
        </h1>
        {currentEp?.locked ? (
          <p className="mt-1 text-sm text-yellow-300/70">
            Episode ini ditandai terkunci/premium oleh API.
          </p>
        ) : null}
      </div>

      {episodes.length > 1 ? (
        <div className="mt-6">
          <h3 className="mb-3 text-sm font-semibold text-white/60">Semua Episode</h3>
          <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-8 md:grid-cols-10">
            {episodes.map((item) => (
              <Link
                key={`${item.source_id || item.id}-${item.episode_index}`}
                href={`/shordrama/${provider.slug}/${encodeURIComponent(dramaId)}/${item.episode_index}`}
                className={`flex items-center justify-center rounded-lg py-2 text-[12px] font-medium transition-colors ${
                  item.episode_index === episodeIndex
                    ? "bg-[var(--dc-gold)]/15 text-[var(--dc-gold)]"
                    : "border border-white/[0.06] text-white/40 hover:text-white/60"
                }`}
              >
                {item.episode_index}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
