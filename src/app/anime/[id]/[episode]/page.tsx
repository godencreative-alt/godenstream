"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeftIcon, ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { fetchAnimeDetail, fetchAnimeEpisodes, fetchAnimeEpisode } from "@/lib/api";
import { saveLocalProgress } from "@/lib/local-history";
import VideoPlayer from "@/components/player/VideoPlayer";
import { Spinner } from "@/components/ui/Spinner";

export default function AnimeEpisodePage({ params }: { params: Promise<{ id: string; episode: string }> }) {
  const { id, episode } = use(params);
  const epNum = parseInt(episode, 10);

  const { data: anime } = useQuery({ queryKey: ["anime-detail", id], queryFn: () => fetchAnimeDetail(id) });
  const { data: episodes } = useQuery({ queryKey: ["anime-episodes", id], queryFn: () => fetchAnimeEpisodes(id) });
  const { data: epData, isLoading } = useQuery({
    queryKey: ["anime-episode", id, epNum],
    queryFn: () => fetchAnimeEpisode(id, epNum),
  });

  const prevEp = episodes?.data?.find((e) => e.episode_number === epNum - 1);
  const nextEp = episodes?.data?.find((e) => e.episode_number === epNum + 1);

  if (isLoading) return <div className="flex min-h-[60vh] items-center justify-center"><Spinner size="lg" /></div>;

  const bestQuality = epData?.video_urls ? Object.keys(epData.video_urls).sort((a, b) => parseInt(b) - parseInt(a))[0] : null;
  const videoSrc = bestQuality && epData?.video_urls ? epData.video_urls[bestQuality] : "";

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-6">
      <div className="mb-4 flex items-center justify-between">
        <Link href={`/anime/${id}`} className="flex items-center gap-2 text-sm text-white/50 hover:text-white">
          <ArrowLeftIcon className="h-4 w-4" />{anime?.name || "Back"}
        </Link>
        <div className="flex items-center gap-2">
          {prevEp && <Link href={`/anime/${id}/${prevEp.episode_number}`} className="rounded-lg p-2 text-white/40 hover:bg-white/[0.05]"><ChevronLeftIcon className="h-4 w-4" /></Link>}
          <span className="text-sm text-white/60">EP {epNum}</span>
          {nextEp && <Link href={`/anime/${id}/${nextEp.episode_number}`} className="rounded-lg p-2 text-white/40 hover:bg-white/[0.05]"><ChevronRightIcon className="h-4 w-4" /></Link>}
        </div>
      </div>

      {videoSrc ? (
        <VideoPlayer src={videoSrc} qualities={epData?.video_urls} subtitles={epData?.subtitles?.map((s) => ({ lang: s.label || s.lang, url: s.url }))} isLandscape
          accentColor="var(--dc-violet)"
          onProgress={(p, d) => { saveLocalProgress({ content_id: id, content_name: anime?.name || "", cover_url: anime?.cover_url || null, episode_number: epNum, progress_seconds: p, duration_seconds: d, completed: p / d > 0.9 }); }}
          onEnded={() => { if (nextEp) window.location.href = `/anime/${id}/${nextEp.episode_number}`; }} />
      ) : (
        <div className="flex aspect-video items-center justify-center rounded-2xl bg-[var(--dc-elevated)]">
          <p className="text-sm text-white/30">Video not available</p>
        </div>
      )}

      <div className="mt-4">
        <h1 className="text-lg font-bold">{anime?.name} — EP {epNum}</h1>
        {epData?.episode_title && <p className="mt-1 text-sm text-white/50">{epData.episode_title}</p>}
      </div>
    </div>
  );
}
