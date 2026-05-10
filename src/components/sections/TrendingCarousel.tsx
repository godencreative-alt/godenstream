"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { fetchShordramaSort, getShordramaHref } from "@/lib/api";
import { useRuntimeSettings } from "@/components/runtime/RuntimeSettingsProvider";
import { cachedMediaUrl } from "@/lib/media-cache-client";

export default function TrendingCarousel() {
  const settings = useRuntimeSettings();
  const carousel = settings?.carousel;
  const enabled = carousel?.enabled ?? true;
  const itemCount = carousel?.itemCount ?? 20;
  const speedSeconds = carousel?.speedSeconds ?? 45;

  const { data, isLoading } = useQuery({
    queryKey: ["front-trending-carousel", itemCount],
    queryFn: () => fetchShordramaSort("trending", 1, itemCount),
    enabled,
  });

  if (!enabled) return null;
  const items = data?.data || [];
  const loopItems = [...items, ...items];

  return (
    <section className="mb-10 overflow-hidden rounded-3xl border border-white/[0.06] bg-white/[0.03] p-4 md:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[var(--dc-gold)]">
            Trending
          </p>
          <h2 className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>
            {carousel?.title || "Trending Sekarang"}
          </h2>
        </div>
        <Link href="/trending" className="rounded-full border border-[var(--dc-gold)]/25 px-3 py-1.5 text-xs font-bold text-[var(--dc-gold)]">
          Lihat semua
        </Link>
      </div>

      {isLoading ? (
        <div className="flex gap-3">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="skeleton h-56 w-36 shrink-0 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="relative">
          <div
            className="flex w-max gap-3 motion-safe:animate-[carousel-scroll_var(--carousel-duration)_linear_infinite] hover:[animation-play-state:paused]"
            style={{ "--carousel-duration": `${speedSeconds}s` } as React.CSSProperties}
          >
            {loopItems.map((item, index) => (
              <Link
                key={`${item.provider_slug}-${item.id}-${index}`}
                href={getShordramaHref(item)}
                className="group w-36 shrink-0"
              >
                <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-[var(--dc-elevated)]">
                  {item.cover_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={cachedMediaUrl(item.cover_url, settings)}
                      alt={item.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="h-full w-full bg-white/[0.05]" />
                  )}
                  <div className="poster-gradient absolute inset-0" />
                  <span className="absolute left-2 top-2 rounded bg-black/60 px-2 py-1 text-[10px] font-bold text-white/80">
                    {item.provider_name}
                  </span>
                </div>
                <p className="mt-2 line-clamp-2 text-xs font-semibold text-white/75 group-hover:text-white">
                  {item.title}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
