"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { fetchComicChapterImages, fetchComicDetail } from "@/lib/api";
import { Spinner } from "@/components/ui/Spinner";

// Comic page image URL resolver. The backend now returns relative
// /v1/asset/<base64> paths (the asset endpoint fetches the upstream
// komiku image server-side with the correct Referer and attaches our API
// key), so those must go through /api/proxy. Absolute komiku URLs still
// need the /api/img proxy for per-host Referer injection.
function proxyPage(url: string): string {
  if (url.startsWith("/v1/")) return `/api/proxy${url}`;
  return `/api/img?url=${encodeURIComponent(url)}`;
}

export default function ComicChapterPage({
  params,
}: {
  params: Promise<{ id: string; chapter: string }>;
}) {
  const { id, chapter } = use(params);
  const searchParams = useSearchParams();
  const type = searchParams.get("type") || "manga";

  const { data: imgs, isLoading, error } = useQuery({
    queryKey: ["comic-chapter-images", chapter, type],
    queryFn: () => fetchComicChapterImages(chapter, { type }),
    retry: 1,
  });

  const { data: detailData } = useQuery({
    queryKey: ["comic-detail", id, type],
    queryFn: () => fetchComicDetail(id, { type }),
  });

  const chapters = detailData?.data?.chapters ?? [];
  const idx = chapters.findIndex((c) => c.slug === chapter);
  // Backend returns chapters newest-first, so the older chapter (reading
  // "prev") is at idx+1 and the newer one (reading "next") is at idx-1.
  // Detail page mirrors this: chapters[length-1] is treated as Chapter 1.
  const prev = idx >= 0 && idx + 1 < chapters.length ? chapters[idx + 1] : null;
  const next = idx > 0 ? chapters[idx - 1] : null;
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
                src={proxyPage(url)}
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
