"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeftIcon, ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { fetchDramaDetail, fetchDramaEpisodes } from "@/lib/api";
import { saveLocalProgress } from "@/lib/local-history";
import VideoPlayer from "@/components/player/VideoPlayer";
import { Spinner } from "@/components/ui/Spinner";

export default function DramaEpisodePage({
  params,
}: {
  params: Promise<{ id: string; episode: string }>;
}) {
  const { id, episode } = use(params);
  const epIndex = parseInt(episode, 10);

  const { data: drama } = useQuery({
    queryKey: ["drama-detail", id],
    queryFn: () => fetchDramaDetail(id),
  });

  const { data: episodes, isLoading } = useQuery({
    queryKey: ["drama-episodes", id],
    queryFn: () => fetchDramaEpisodes(id),
  });

  const currentEp = episodes?.data?.find((e) => e.episode_index === epIndex);
  const prevEp = episodes?.data?.find((e) => e.episode_index === epIndex - 1);
  const nextEp = episodes?.data?.find((e) => e.episode_index === epIndex + 1);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const videoSrc =
    currentEp?.video_url || Object.values(currentEp?.qualities || {})[0] || "";

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-6">
      {/* Top bar */}
      <div className="mb-4 flex items-center justify-between">
        <Link
          href={`/drama/${id}`}
          className="flex items-center gap-2 text-sm text-white/50 hover:text-white"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          {drama?.title || "Back"}
        </Link>
        <div className="flex items-center gap-2">
          {prevEp && (
            <Link
              href={`/drama/${id}/${prevEp.episode_index}`}
              className="rounded-lg p-2 text-white/40 hover:bg-white/[0.05] hover:text-white"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </Link>
          )}
          <span className="text-sm text-white/60">EP {epIndex}</span>
          {nextEp && (
            <Link
              href={`/drama/${id}/${nextEp.episode_index}`}
              className="rounded-lg p-2 text-white/40 hover:bg-white/[0.05] hover:text-white"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>

      {/* Player */}
      {videoSrc ? (
        <VideoPlayer
          src={videoSrc}
          qualities={currentEp?.qualities}
          subtitleUrl={currentEp?.subtitle_url}
          subtitles={currentEp?.subtitles}
          isLandscape={false}
          accentColor="var(--dc-gold)"
          onProgress={(progress, duration) => {
            saveLocalProgress({
              content_id: id,
              content_name: drama?.title || "",
              cover_url: drama?.cover_url || null,
              episode_number: epIndex,
              progress_seconds: progress,
              duration_seconds: duration,
              completed: progress / duration > 0.9,
            });
          }}
          onEnded={() => {
            if (nextEp) {
              window.location.href = `/drama/${id}/${nextEp.episode_index}`;
            }
          }}
        />
      ) : (
        <div className="flex aspect-video items-center justify-center rounded-2xl bg-[var(--dc-elevated)]">
          <p className="text-sm text-white/30">Video not available</p>
        </div>
      )}

      {/* Episode info */}
      <div className="mt-4">
        <h1 className="text-lg font-bold">
          {drama?.title} — EP {epIndex}
        </h1>
        {currentEp?.episode_name && (
          <p className="mt-1 text-sm text-white/50">{currentEp.episode_name}</p>
        )}
      </div>

      {/* Episode list */}
      {episodes?.data && episodes.data.length > 1 && (
        <div className="mt-6">
          <h3 className="mb-3 text-sm font-semibold text-white/60">
            All Episodes
          </h3>
          <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-8 md:grid-cols-10">
            {episodes.data.map((ep) => (
              <Link
                key={ep.id}
                href={`/drama/${id}/${ep.episode_index}`}
                className={`flex items-center justify-center rounded-lg py-2 text-[12px] font-medium transition-colors ${
                  ep.episode_index === epIndex
                    ? "bg-[var(--dc-gold)]/15 text-[var(--dc-gold)]"
                    : "border border-white/[0.06] text-white/40 hover:text-white/60"
                }`}
              >
                {ep.episode_index}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
