"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { fetchShordramaHome, getShordramaHref } from "@/lib/api";
import ContentCard from "@/components/sections/ContentCard";

function SectionSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
      {Array.from({ length: 10 }).map((_, index) => (
        <div key={index}>
          <div className="skeleton aspect-[3/4] rounded-xl" />
          <div className="skeleton mt-2 h-3 w-3/4 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export default function HomePage() {
  const { data: sections, isLoading } = useQuery({
    queryKey: ["shordrama-home"],
    queryFn: fetchShordramaHome,
  });

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 top-12 h-96 w-96 rounded-full bg-yellow-500/10 blur-[120px]" />
        <div className="absolute right-0 top-80 h-96 w-96 rounded-full bg-emerald-500/5 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-10 md:px-6">
        <section className="mb-10 rounded-3xl border border-white/[0.06] bg-white/[0.03] p-6 md:p-10">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.35em] text-[var(--dc-gold)]">
            Shordrama Platform
          </p>
          <h1
            className="max-w-3xl text-4xl font-bold leading-tight text-white md:text-6xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Drama<span className="gradient-text-gold">Short</span> untuk short
            drama pilihan.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-white/55 md:text-base">
            Fokus pada drama pendek dari Drama-ID, DramaBox, Melolo, NetShort,
            dan DramaNova. Setiap platform tampil 5 kolom x 2 baris di halaman
            awal.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              href="/trending"
              className="rounded-full bg-[var(--dc-gold)] px-4 py-2 text-sm font-bold text-black"
            >
              Lihat Trending
            </Link>
            <Link
              href="/terbaru"
              className="rounded-full border border-white/[0.08] px-4 py-2 text-sm font-semibold text-white/70 hover:text-white"
            >
              Drama Terbaru
            </Link>
          </div>
        </section>

        <div className="space-y-12">
          {isLoading && (
            <>
              <SectionSkeleton />
              <SectionSkeleton />
            </>
          )}

          {sections?.map(({ platform, dramas }) => (
            <section key={platform.slug}>
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-white/25">
                    Platform
                  </p>
                  <h2
                    className="text-2xl font-bold text-white"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {platform.name}
                  </h2>
                </div>
                <Link
                  href={`/platform/${platform.slug}`}
                  className="shrink-0 rounded-full border border-[var(--dc-gold)]/25 px-3 py-1.5 text-xs font-bold text-[var(--dc-gold)] hover:bg-[var(--dc-gold)]/10"
                >
                  Selengkapnya
                </Link>
              </div>

              {dramas.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
                  {dramas.slice(0, 10).map((drama, index) => (
                    <ContentCard
                      key={`${platform.slug}-${drama.id}-${index}`}
                      item={drama}
                      href={getShordramaHref(drama)}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-white/[0.06] p-8 text-center text-sm text-white/35">
                  Konten {platform.name} belum tersedia dari API.
                </div>
              )}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
