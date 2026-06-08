"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { BookOpenIcon, FilmIcon } from "@heroicons/react/24/solid";
import { fetchComicDetail } from "@/lib/api";
import { Spinner } from "@/components/ui/Spinner";

export default function ComicDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const { data: detail, isLoading } = useQuery({
    queryKey: ["comic-detail", id],
    queryFn: () => fetchComicDetail(id),
  });

  const item = detail?.data;
  const chapters = item?.chapters ?? [];

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-white/40">Komik tidak ditemukan</p>
      </div>
    );
  }

  const firstCh = chapters[chapters.length - 1] || chapters[0];
  const infoEntries = Object.entries(item.info || {});

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <div className="flex flex-col gap-6 md:flex-row md:gap-8">
        <div className="w-48 shrink-0 self-center md:w-56 md:self-start">
          <div className="relative aspect-[3/4] overflow-hidden rounded-2xl shadow-2xl">
            {item.thumbnail ? (
              <Image
                src={item.thumbnail}
                alt={item.title}
                fill
                className="object-cover"
                priority
                unoptimized
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-[var(--dc-elevated)]">
                <FilmIcon className="h-12 w-12 text-white/20" />
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 space-y-4">
          <h1
            className="text-2xl font-bold md:text-3xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {item.title}
          </h1>

          {infoEntries.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 text-[12px] text-white/40">
              {infoEntries.slice(0, 6).map(([key, value]) => (
                <span key={key}>
                  <span className="capitalize text-white/30">{key}:</span>{" "}
                  {value}
                </span>
              ))}
            </div>
          )}

          {item.description && (
            <p className="text-sm leading-relaxed text-white/50">
              {item.description}
            </p>
          )}

          {firstCh && (
            <Link
              href={`/comic/${encodeURIComponent(id)}/${encodeURIComponent(firstCh.slug)}`}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--dc-rose)] px-5 py-2.5 text-sm font-semibold text-white hover:brightness-110"
            >
              <BookOpenIcon className="h-4 w-4" />
              Baca Chapter Pertama
            </Link>
          )}
        </div>
      </div>

      {chapters.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-lg font-semibold">Chapters</h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {chapters.map((ch) => (
              <Link
                key={ch.slug}
                href={`/comic/${encodeURIComponent(id)}/${encodeURIComponent(ch.slug)}`}
                className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-sm text-white/70 transition-colors hover:border-[var(--dc-rose)]/30 hover:bg-[var(--dc-rose)]/5 hover:text-white"
              >
                {ch.title}
                {ch.date && (
                  <span className="ml-2 text-[10px] text-white/30">
                    {ch.date}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
