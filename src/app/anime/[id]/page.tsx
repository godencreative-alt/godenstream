"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { PlayIcon, FilmIcon } from "@heroicons/react/24/solid";
import { fetchAnimeDetail, fetchAnimeEpisodes } from "@/lib/api";
import { Spinner } from "@/components/ui/Spinner";

export default function AnimeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const { data: anime, isLoading } = useQuery({
    queryKey: ["anime-detail", id],
    queryFn: () => fetchAnimeDetail(id),
  });

  const { data: episodes } = useQuery({
    queryKey: ["anime-episodes", id],
    queryFn: () => fetchAnimeEpisodes(id),
  });

  if (isLoading) return <div className="flex min-h-[60vh] items-center justify-center"><Spinner size="lg" /></div>;
  if (!anime) return <div className="flex min-h-[60vh] items-center justify-center"><p className="text-white/40">Not found</p></div>;

  const coverUrl = anime.anilist_data?.coverImage?.large || anime.cover_url;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <div className="flex flex-col gap-6 md:flex-row md:gap-8">
        <div className="w-48 shrink-0 self-center md:w-56 md:self-start">
          <div className="relative aspect-[3/4] overflow-hidden rounded-2xl shadow-2xl">
            {coverUrl ? <Image src={coverUrl} alt={anime.name} fill className="object-cover" priority /> : (
              <div className="flex h-full items-center justify-center bg-[var(--dc-elevated)]"><FilmIcon className="h-12 w-12 text-white/20" /></div>
            )}
          </div>
        </div>
        <div className="flex-1 space-y-4">
          <h1 className="text-2xl font-bold md:text-3xl" style={{ fontFamily: "var(--font-display)" }}>{anime.name}</h1>
          <div className="flex flex-wrap items-center gap-3 text-[12px] text-white/40">
            {anime.anilist_data?.averageScore && <span className="text-[var(--dc-violet)]">★ {(anime.anilist_data.averageScore / 10).toFixed(1)}</span>}
            {anime.available_episodes > 0 && <span>{anime.available_episodes} Episodes</span>}
            {anime.anilist_data?.seasonYear && <span>{anime.anilist_data.seasonYear}</span>}
          </div>
          {anime.genres.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {anime.genres.map((g) => <span key={g} className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-2.5 py-1 text-[11px] text-white/40">{g}</span>)}
            </div>
          )}
          {anime.description && <p className="whitespace-pre-line text-sm leading-relaxed text-white/50">{anime.description.replace(/<[^>]*>/g, "")}</p>}
          {episodes?.data?.[0] && (
            <Link href={`/anime/${id}/${episodes.data[0].episode_number}`}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--dc-violet)] px-5 py-2.5 text-sm font-semibold text-white hover:brightness-110">
              <PlayIcon className="h-4 w-4" /> Watch EP 1
            </Link>
          )}
        </div>
      </div>

      {episodes?.data && episodes.data.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-lg font-semibold">Episodes</h2>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10">
            {episodes.data.map((ep) => (
              <Link key={ep.id} href={`/anime/${id}/${ep.episode_number}`}
                className="flex items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.02] py-3 text-[13px] font-medium text-white/60 hover:border-[var(--dc-violet)]/30 hover:bg-[var(--dc-violet)]/5 hover:text-[var(--dc-violet)]">
                {ep.episode_number}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
