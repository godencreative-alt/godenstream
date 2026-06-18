"use client";

import { use } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  ArrowLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import {
  fetchDonghuaDetail,
  fetchDonghuaEpisodes,
  fetchDonghuaEpisodeSources,
  pickPlayback,
  pickEmbedUrl,
} from "@/lib/api";
import { saveLocalProgress } from "@/lib/local-history";
import VideoPlayer from "@/components/player/VideoPlayer";
import SafeEmbed from "@/components/player/SafeEmbed";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorState } from "@/components/ui/ErrorState";

export default function DonghuaEpisodePage({
  params,
}: {
  params: Promise<{ id: string; episode: string }>;
}) {
  const { id, episode } = use(params);
  const sp = useSearchParams();
  const source = sp.get("source") ?? undefined;


  const { data: detail } = useQuery({
    queryKey: ["donghua-detail", id],
    queryFn: () => fetchDonghuaDetail(id, source),
  });
  const { data: epList } = useQuery({
    queryKey: ["donghua-episodes", id],
    queryFn: () => fetchDonghuaEpisodes(id, source),
  });
  const { data: sourceData, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["donghua-episode-sources", episode],
    queryFn: () => fetchDonghuaEpisodeSources(episode, source),
    retry: 1,
  });

  const item = detail?.data;
  const episodes = epList?.data ?? item?.episodes ?? [];
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

  if (isError) return <ErrorState message={error?.message} retry={() => refetch()} />;

  const { src: videoUrl, sourceType: videoType, qualities } = pickPlayback(sources);
  const embedUrl = pickEmbedUrl(sources);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-6">
      <div className="mb-4 flex items-center justify-between">
        <Link
          href={`/donghua/${encodeURIComponent(id)}${source ? `?source=${encodeURIComponent(source)}` : ""}`}
          className="flex items-center gap-2 text-sm text-white/50 hover:text-white"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          {item?.title || "Kembali"}
        </Link>
        <div className="flex items-center gap-2">
          {prevEp && (
            <Link
              href={`/donghua/${encodeURIComponent(id)}/${encodeURIComponent(prevEp.slug)}${source ? `?source=${encodeURIComponent(source)}` : ""}`}
              className="rounded-lg p-2 text-white/40 hover:bg-white/[0.05] hover:text-white"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </Link>
          )}
          <span className="text-sm text-white/60">Episode</span>
          {nextEp && (
            <Link
              href={`/donghua/${encodeURIComponent(id)}/${encodeURIComponent(nextEp.slug)}${source ? `?source=${encodeURIComponent(source)}` : ""}`}
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
          sourceType={videoType}
          qualities={Object.keys(qualities).length > 0 ? qualities : null}
          isLandscape
          accentColor="var(--dc-cyan)"
          onProgress={(progress, duration) => {
            saveLocalProgress({
              content_id: id,
              content_name: item?.title || "",
              cover_url: item?.thumbnail || null,
              episode_number: Math.max(currentIndex + 1, 1),
              episode_slug: episode,
              progress_seconds: progress,
              duration_seconds: duration,
              completed: duration > 0 ? progress / duration > 0.9 : false,
            });
          }}
          onEnded={() => {
            if (nextEp) {
              window.location.href = `/donghua/${encodeURIComponent(id)}/${encodeURIComponent(nextEp.slug)}${source ? `?source=${encodeURIComponent(source)}` : ""}`;
            }
          }}
        />
      ) : embedUrl ? (
        <SafeEmbed src={embedUrl} title={sourceData?.data?.title || "Donghua player"} />
      ) : (
        <div className="flex aspect-video items-center justify-center rounded-2xl bg-[var(--dc-elevated)]">
          <p className="text-sm text-white/30">
            {error ? "Gagal memuat video. Coba lagi." : "Video tidak tersedia"}
          </p>
        </div>
      )}

      <div className="mt-4">
        <h1 className="text-lg font-bold">{item?.title || "Donghua"}</h1>
        {currentEp?.title && (
          <p className="mt-1 text-sm text-white/50">{currentEp.title}</p>
        )}
      </div>

      {episodes.length > 1 && (
        <div className="mt-6">
          <h3 className="mb-3 text-sm font-semibold text-white/60">
            Semua Episode
          </h3>
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
            {episodes.map((ep) => (
              <Link
                key={ep.slug}
                href={`/donghua/${encodeURIComponent(id)}/${encodeURIComponent(ep.slug)}${source ? `?source=${encodeURIComponent(source)}` : ""}`}
                className={`rounded-lg px-3 py-2 text-[12px] font-medium transition-colors ${
                  ep.slug === episode
                    ? "bg-[var(--dc-cyan)]/15 text-[var(--dc-cyan)]"
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
