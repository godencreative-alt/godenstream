"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { fetchComicChapterImages, fetchComicDetail } from "@/lib/api";
import { Spinner } from "@/components/ui/Spinner";

export default function ComicChapterPage({
  params,
}: {
  params: Promise<{ id: string; chapter: string }>;
}) {
  const { id, chapter } = use(params);

  const { data: imgs, isLoading, error } = useQuery({
    queryKey: ["comic-chapter-images", chapter],
    queryFn: () => fetchComicChapterImages(chapter),
    retry: 1,
  });

  const { data: detailData } = useQuery({
    queryKey: ["comic-detail", id],
    queryFn: () => fetchComicDetail(id),
  });

  const chapters = detailData?.data?.chapters ?? [];
  const idx = chapters.findIndex((c) => c.slug === chapter);
  const prev = idx > 0 ? chapters[idx - 1] : null;
  const next = idx >= 0 ? chapters[idx + 1] : null;
  const images = imgs?.data ?? [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:px-6">
      <div className="mb-4 flex items-center justify-between">
        <Link
          href={`/comic/${encodeURIComponent(id)}`}
          className="flex items-center gap-2 text-sm text-white/50 hover:text-white"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Kembali
        </Link>
        <div className="flex items-center gap-2 text-xs">
          {prev && (
            <Link
              href={`/comic/${encodeURIComponent(id)}/${encodeURIComponent(prev.slug)}`}
              className="rounded-lg border border-white/[0.08] px-3 py-1.5 text-white/60 hover:text-white"
            >
              Prev
            </Link>
          )}
          {next && (
            <Link
              href={`/comic/${encodeURIComponent(id)}/${encodeURIComponent(next.slug)}`}
              className="rounded-lg border border-white/[0.08] px-3 py-1.5 text-white/60 hover:text-white"
            >
              Next
            </Link>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex min-h-[60vh] items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <p className="py-20 text-center text-sm text-white/40">
          Gagal memuat chapter.
        </p>
      ) : images.length === 0 ? (
        <p className="py-20 text-center text-sm text-white/40">
          Tidak ada halaman.
        </p>
      ) : (
        <div className="flex flex-col gap-1">
          {images.map((url, i) => (
            <div key={i} className="relative w-full">
              <Image
                src={url}
                alt={`Page ${i + 1}`}
                width={900}
                height={1300}
                className="h-auto w-full"
                unoptimized
              />
            </div>
          ))}
        </div>
      )}

      {(prev || next) && (
        <div className="mt-6 flex items-center justify-between gap-2 text-sm">
          {prev ? (
            <Link
              href={`/comic/${encodeURIComponent(id)}/${encodeURIComponent(prev.slug)}`}
              className="rounded-lg border border-white/[0.08] px-4 py-2 text-white/60 hover:text-white"
            >
              ← {prev.title}
            </Link>
          ) : (
            <span />
          )}
          {next && (
            <Link
              href={`/comic/${encodeURIComponent(id)}/${encodeURIComponent(next.slug)}`}
              className="rounded-lg border border-white/[0.08] px-4 py-2 text-white/60 hover:text-white"
            >
              {next.title} →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
