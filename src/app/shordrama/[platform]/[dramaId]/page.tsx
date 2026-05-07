"use client";

import { use } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { PlayIcon, FilmIcon } from "@heroicons/react/24/solid";
import { ArrowLeftIcon, LockClosedIcon } from "@heroicons/react/24/outline";
import { fetchShordramaDetail, getShordramaPlatform } from "@/lib/api";
import { providerBadgeColor, formatPlayCount } from "@/lib/utils";
import { Spinner } from "@/components/ui/Spinner";

export default function ShordramaDetailPage({
  params,
}: {
  params: Promise<{ platform: string; dramaId: string }>;
}) {
  const { platform, dramaId } = use(params);
  const provider = getShordramaPlatform(platform);

  const { data: drama, isLoading } = useQuery({
    queryKey: ["shordrama-detail", platform, dramaId],
    queryFn: () => fetchShordramaDetail(platform, dramaId),
    enabled: Boolean(provider),
  });

  if (!provider) notFound();

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!drama) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-white/40">Drama tidak ditemukan.</p>
      </div>
    );
  }

  const firstEpisode = drama.episodes?.[0];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <Link
        href={`/platform/${provider.slug}`}
        className="mb-6 inline-flex items-center gap-2 text-sm text-white/45 hover:text-white"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Kembali ke {provider.name}
      </Link>

      <div className="grid gap-8 md:grid-cols-[240px_1fr]">
        <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-[var(--dc-elevated)] shadow-2xl">
          {drama.cover_url ? (
            <Image
              src={drama.cover_url}
              alt={drama.title}
              fill
              className="object-cover"
              sizes="240px"
              priority
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <FilmIcon className="h-12 w-12 text-white/20" />
            </div>
          )}
        </div>

        <div className="min-w-0">
          <span
            className={`mb-3 inline-flex rounded-md border px-2 py-1 text-[11px] font-bold ${providerBadgeColor(
              provider.name,
            )}`}
          >
            {provider.name}
          </span>
          <h1
            className="text-3xl font-bold text-white md:text-5xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {drama.title}
          </h1>

          <div className="mt-4 flex flex-wrap gap-3 text-sm text-white/45">
            {drama.chapter_count ? <span>{drama.chapter_count} Episode</span> : null}
            {drama.play_count > 0 ? <span>{formatPlayCount(drama.play_count)} views</span> : null}
            {drama.language ? <span>{drama.language.toUpperCase()}</span> : null}
          </div>

          {drama.introduction ? (
            <p className="mt-5 max-w-3xl text-sm leading-7 text-white/60 md:text-base">
              {drama.introduction}
            </p>
          ) : null}

          {drama.tags?.length ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {drama.tags.map((tag) => (
                <span
                  key={`${tag.id}-${tag.name}`}
                  className="rounded-full border border-white/[0.08] px-3 py-1 text-xs text-white/45"
                >
                  {tag.name}
                </span>
              ))}
            </div>
          ) : null}

          {firstEpisode ? (
            <Link
              href={`/shordrama/${provider.slug}/${encodeURIComponent(dramaId)}/${firstEpisode.episode_index}`}
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-[var(--dc-gold)] px-5 py-3 text-sm font-bold text-black"
            >
              <PlayIcon className="h-5 w-5" />
              Putar Episode 1
            </Link>
          ) : (
            <div className="mt-7 rounded-2xl border border-white/[0.06] p-4 text-sm text-white/35">
              Episode belum tersedia dari API.
            </div>
          )}
        </div>
      </div>

      {drama.episodes?.length ? (
        <section className="mt-10">
          <h2
            className="mb-4 text-2xl font-bold text-white"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Pilih Episode
          </h2>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-10 lg:grid-cols-12">
            {drama.episodes.map((episode) => (
              <Link
                key={`${episode.source_id || episode.id}-${episode.episode_index}`}
                href={`/shordrama/${provider.slug}/${encodeURIComponent(dramaId)}/${episode.episode_index}`}
                className="flex items-center justify-center gap-1 rounded-xl border border-white/[0.06] bg-white/[0.02] py-3 text-sm font-semibold text-white/55 hover:border-[var(--dc-gold)]/30 hover:bg-[var(--dc-gold)]/10 hover:text-[var(--dc-gold)]"
              >
                {episode.locked ? <LockClosedIcon className="h-3.5 w-3.5" /> : null}
                {episode.episode_index}
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
