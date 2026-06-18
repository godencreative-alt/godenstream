"use client";

import { use, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { FilmIcon } from "@heroicons/react/24/solid";
import {
  fetchAdultDetail,
  fetchAdultSources,
  fetchVaultResolve,
  pickPlayback,
  pickEmbedUrl,
  pickVaultPlayback,
} from "@/lib/api";
import { saveLocalProgress } from "@/lib/local-history";
import VideoPlayer from "@/components/player/VideoPlayer";
import SafeEmbed from "@/components/player/SafeEmbed";
import { Spinner } from "@/components/ui/Spinner";
import { proxyThumbnail } from "@/lib/utils";
import type { GodenSource } from "@/types";

const AGE_KEY = "godenstream_age_ok";
const VALID_TYPES = ["west", "indonesia", "jav", "asia", "korea"] as const;
type AdultType = (typeof VALID_TYPES)[number];

function normalizeAdultType(type: string | null): AdultType {
  if (type === "asia" || type === "korea") return "asia";
  if (type === "indonesia") return "indonesia";
  if (type === "jav") return "jav";
  return "west";
}

function vaultCategoryForAdult(type: AdultType): string {
  return type === "indonesia" ? "adult-indonesia" : "adult-west";
}

export default function AdultDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const sp = useSearchParams();
  const rawType = sp.get("type") ?? "west";
  const type = normalizeAdultType(rawType);
  const [ok, setOk] = useState<boolean | null>(null);

  useEffect(() => {
    setOk(localStorage.getItem(AGE_KEY) === "1");
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["adult-detail", id, type],
    queryFn: () => fetchAdultDetail(id, type),
    enabled: ok === true,
  });

  const { data: sourcesData } = useQuery({
    queryKey: ["adult-sources", id, type],
    queryFn: () => fetchAdultSources(id, type),
    enabled: ok === true && !!data?.data,
  });

  const { data: vaultData } = useQuery({
    queryKey: ["vault-resolve", vaultCategoryForAdult(type), id],
    queryFn: () => fetchVaultResolve({ category: vaultCategoryForAdult(type), slug: id, kind: "video" }),
    enabled: ok === true && data?.data?.in_vault === true,
  });

  if (ok === null) return null;

  if (!ok) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-sm text-white/60">
          Sahkan umur 18+ di halaman /adult dahulu.
        </p>
        <Link
          href="/adult"
          className="rounded-xl bg-[var(--dc-rose)] px-4 py-2 text-sm font-semibold text-white"
        >
          Pergi ke /adult
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const item = data?.data;
  if (!item) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-white/40">Konten tidak dijumpai</p>
      </div>
    );
  }

  const sources: GodenSource[] = sourcesData?.data?.length
    ? sourcesData.data
    : item.sources ?? [];
  const vaultPlayback = pickVaultPlayback(vaultData);
  const playback = (item as any).playback;
  const preferEmbed = playback?.preferred === "embed";
  const regularPlayback = preferEmbed
    ? { src: null as string | null, sourceType: undefined, qualities: {} as Record<string, string> }
    : pickPlayback(sources);
  const videoUrl = vaultPlayback.src ?? regularPlayback.src;
  const videoType = vaultPlayback.src ? vaultPlayback.sourceType : regularPlayback.sourceType;
  const qualities = vaultPlayback.src ? vaultPlayback.qualities : regularPlayback.qualities;
  const embedUrl = vaultPlayback.src ? null : pickEmbedUrl(sources);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-6">
      <div className="mb-4 flex items-center justify-between">
        <Link
          href={`/adult/browse?type=${encodeURIComponent(type)}`}
          className="flex items-center gap-2 text-sm text-white/50 hover:text-white"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Adult
        </Link>
      </div>

      {videoUrl ? (
        <VideoPlayer
          src={videoUrl}
          sourceType={videoType}
          qualities={Object.keys(qualities).length > 0 ? qualities : null}
          isLandscape
          accentColor="var(--dc-rose)"
          onProgress={(progress, duration) => {
            saveLocalProgress({
              content_id: id,
              content_name: item.title,
              cover_url: item.thumbnail || null,
              episode_number: 1,
              episode_slug: id,
              progress_seconds: progress,
              duration_seconds: duration,
              completed: duration > 0 ? progress / duration > 0.9 : false,
            });
          }}
        />
      ) : embedUrl ? (
        <SafeEmbed src={embedUrl} title={item.title} />
      ) : (
        <div className="flex aspect-video items-center justify-center rounded-2xl bg-[var(--dc-elevated)]">
          <p className="text-sm text-white/30">Video tidak tersedia</p>
        </div>
      )}

      <div className="mt-6 flex flex-col gap-4 md:flex-row md:gap-8">
        <div className="w-32 shrink-0">
          <div className="relative aspect-[3/4] overflow-hidden rounded-xl">
            {item.thumbnail ? (
              <Image
                src={proxyThumbnail(item.thumbnail) ?? item.thumbnail}
                alt={item.title}
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-[var(--dc-elevated)]">
                <FilmIcon className="h-8 w-8 text-white/20" />
              </div>
            )}
          </div>
        </div>
        <div className="flex-1">
          <h1
            className="text-xl font-bold md:text-2xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {item.title}
          </h1>
        </div>
      </div>
    </div>
  );
}
