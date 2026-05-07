"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { PlayIcon, FilmIcon } from "@heroicons/react/24/solid";
import { fetchIqiyiDetail, fetchIqiyiEpisodes } from "@/lib/api";
import { Spinner } from "@/components/ui/Spinner";

export default function IqiyiDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: drama, isLoading } = useQuery({ queryKey: ["iqiyi-detail", id], queryFn: () => fetchIqiyiDetail(id) });
  const { data: episodes } = useQuery({ queryKey: ["iqiyi-episodes", id], queryFn: () => fetchIqiyiEpisodes(id) });

  if (isLoading) return <div className="flex min-h-[60vh] items-center justify-center"><Spinner size="lg" /></div>;
  if (!drama) return <div className="flex min-h-[60vh] items-center justify-center"><p className="text-white/40">Not found</p></div>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <div className="flex flex-col gap-6 md:flex-row md:gap-8">
        <div className="w-48 shrink-0 self-center md:w-56 md:self-start">
          <div className="relative aspect-[3/4] overflow-hidden rounded-2xl shadow-2xl">
            {drama.cover_url ? <Image src={drama.cover_url} alt={drama.title} fill className="object-cover" priority /> :
              <div className="flex h-full items-center justify-center bg-[var(--dc-elevated)]"><FilmIcon className="h-12 w-12 text-white/20" /></div>}
          </div>
        </div>
        <div className="flex-1 space-y-4">
          <h1 className="text-2xl font-bold md:text-3xl" style={{ fontFamily: "var(--font-display)" }}>{drama.title}</h1>
          <div className="flex flex-wrap items-center gap-3 text-[12px] text-white/40">
            {drama.chapter_count && <span>{drama.chapter_count} EP</span>}
          </div>
          {drama.introduction && <p className="text-sm leading-relaxed text-white/50">{drama.introduction}</p>}
          {episodes?.data?.[0] && (
            <Link href={`/iqiyi/${id}/${episodes.data[0].episode_index}`}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--dc-cyan)] px-5 py-2.5 text-sm font-semibold text-zinc-900 hover:brightness-110">
              <PlayIcon className="h-4 w-4" /> Watch
            </Link>
          )}
        </div>
      </div>
      {episodes?.data && episodes.data.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-lg font-semibold">Episodes</h2>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10">
            {episodes.data.map((ep) => (
              <Link key={ep.id} href={`/iqiyi/${id}/${ep.episode_index}`}
                className="flex items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.02] py-3 text-[13px] font-medium text-white/60 hover:border-[var(--dc-cyan)]/30 hover:bg-[var(--dc-cyan)]/5 hover:text-[var(--dc-cyan)]">
                {ep.episode_index}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
