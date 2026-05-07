"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { fetchIqiyiDetail, fetchIqiyiEpisodes } from "@/lib/api";
import VideoPlayer from "@/components/player/VideoPlayer";
import { Spinner } from "@/components/ui/Spinner";

export default function IqiyiEpisodePage({ params }: { params: Promise<{ id: string; episode: string }> }) {
  const { id, episode } = use(params);
  const epIdx = parseInt(episode, 10);
  const { data: drama } = useQuery({ queryKey: ["iqiyi-detail", id], queryFn: () => fetchIqiyiDetail(id) });
  const { data: episodes, isLoading } = useQuery({ queryKey: ["iqiyi-episodes", id], queryFn: () => fetchIqiyiEpisodes(id) });
  const ep = episodes?.data?.find((e) => e.episode_index === epIdx);
  const nextEp = episodes?.data?.find((e) => e.episode_index === epIdx + 1);

  if (isLoading) return <div className="flex min-h-[60vh] items-center justify-center"><Spinner size="lg" /></div>;

  const videoSrc = ep?.video_url || Object.values(ep?.qualities || {})[0] || "";

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-6">
      <div className="mb-4"><Link href={`/iqiyi/${id}`} className="flex items-center gap-2 text-sm text-white/50 hover:text-white"><ArrowLeftIcon className="h-4 w-4" />{drama?.title || "Back"}</Link></div>
      {videoSrc ? <VideoPlayer src={videoSrc} qualities={ep?.qualities} isLandscape={false} accentColor="var(--dc-cyan)"
        onEnded={() => { if (nextEp) window.location.href = `/iqiyi/${id}/${nextEp.episode_index}`; }} />
        : <div className="flex aspect-video items-center justify-center rounded-2xl bg-[var(--dc-elevated)]"><p className="text-sm text-white/30">Video not available</p></div>}
      <div className="mt-4"><h1 className="text-lg font-bold">{drama?.title} — EP {epIdx}</h1></div>
    </div>
  );
}
