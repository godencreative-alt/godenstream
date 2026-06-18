"use client";

import { use } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { FilmIcon } from "@heroicons/react/24/solid";
import {
  fetchEntertainmentDetail,
  fetchEntertainmentSources,
  fetchEntertainmentGenres,
  fetchVaultResolve,
  pickPlayback,
  pickEmbedUrl,
  pickVaultPlayback,
} from "@/lib/api";
import { providerBadgeColor, proxyThumbnail } from "@/lib/utils";
import { saveLocalProgress } from "@/lib/local-history";
import VideoPlayer from "@/components/player/VideoPlayer";
import SafeEmbed from "@/components/player/SafeEmbed";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorState } from "@/components/ui/ErrorState";

export default function EntertainmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const sp = useSearchParams();
  const subcategory = sp.get("subcategory") ?? "movie";
  const type = sp.get("type") ?? undefined;

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["entertainment-detail", id, subcategory, type],
    queryFn: () => fetchEntertainmentDetail(id, subcategory, type),
  });

  const { data: sourcesData } = useQuery({
    queryKey: ["entertainment-sources", id, subcategory, type],
    queryFn: () => fetchEntertainmentSources(id, subcategory, type),
    enabled: !!data?.data,
  });

  const { data: vaultData } = useQuery({
    queryKey: ["vault-resolve", subcategory, id, type],
    queryFn: () => fetchVaultResolve({
      category: subcategory === "adult" ? "adult" : subcategory,
      slug: id,
      kind: "video"
    }),
    enabled: data?.data?.in_vault === true,
  });

  const detail = data?.data;
  const sources = sourcesData?.data?.sources ?? detail?.sources ?? [];

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError) return <ErrorState message={error?.message} retry={() => refetch()} />;

  if (!detail) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-white/40">Entertainment not found</p>
      </div>
    );
  }

  const vaultPlayback = pickVaultPlayback(vaultData);
  const preferEmbed = (detail as any).playback?.preferred === "embed";
  const regularPlayback = preferEmbed
    ? { src: null as string | null, sourceType: undefined, qualities: {} as Record<string, string> }
    : pickPlayback(sources);
  const videoUrl = vaultPlayback.src ?? regularPlayback.src;
  const videoType = vaultPlayback.src ? vaultPlayback.sourceType : regularPlayback.sourceType;
  const qualities = vaultPlayback.src ? vaultPlayback.qualities : regularPlayback.qualities;
  const embedUrl = vaultPlayback.src ? null : pickEmbedUrl(sources);
  const infoEntries = Object.entries(detail.info || {});

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
      <div className="mb-4">
        <Link
          href={`/entertainment/browse?subcategory=${encodeURIComponent(subcategory)}${type ? `&type=${encodeURIComponent(type)}` : ''}`}
          className="text-sm text-white/50 hover:text-white"
        >
          ← Back to Entertainment
        </Link>
      </div>

      <div className="mb-6">
        {videoUrl ? (
          <VideoPlayer
            src={videoUrl}
            sourceType={videoType}
            qualities={Object.keys(qualities).length > 0 ? qualities : null}
            isLandscape
            accentColor="var(--dc-gold)"
            onProgress={(progress, duration) => {
              saveLocalProgress({
                content_id: id,
                content_name: detail.title,
                cover_url: detail.thumbnail || null,
                episode_number: 1,
                episode_slug: id,
                progress_seconds: progress,
                duration_seconds: duration,
                completed: duration > 0 ? progress / duration > 0.9 : false,
              });
            }}
          />
        ) : embedUrl ? (
          <SafeEmbed src={embedUrl} title={detail.title} />
        ) : (
          <div className="flex aspect-video items-center justify-center rounded-2xl bg-[var(--dc-elevated)]">
            <p className="text-sm text-white/30">Video not available</p>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-6 md:flex-row md:gap-8">
        <div className="w-40 shrink-0 self-center md:self-start">
          <div className="relative aspect-[3/4] overflow-hidden rounded-2xl shadow-2xl">
            {detail.thumbnail ? (
              <Image
                src={proxyThumbnail(detail.thumbnail) ?? detail.thumbnail}
                alt={detail.title}
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
          {detail.source && (
            <span
              className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${providerBadgeColor(detail.source)}`}
            >
              {detail.source}
            </span>
          )}
          <h1
            className="text-2xl font-bold md:text-3xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {detail.title}
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

          {detail.description && (
            <p className="text-sm leading-relaxed text-white/50">
              {detail.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
