"use client";

import Link from "next/link";
import Image from "next/image";
import { PlayIcon, FilmIcon } from "@heroicons/react/24/solid";
import { providerBadgeColor, proxyThumbnail } from "@/lib/utils";

interface ContentCardProps {
  item: {
    id?: number | string;
    slug?: string;
    title?: string;
    name?: string;
    cover_url?: string | null;
    thumbnail?: string | null;
    provider_name?: string;
    source?: string;
    chapter_count?: number | null;
    available_episodes?: number;
    play_count?: number;
  };
  href: string;
  accentColor?: string;
}

export default function ContentCard({ item, href }: ContentCardProps) {
  const title = item.title || item.name || "Untitled";
  const coverUrl = proxyThumbnail(item.thumbnail || item.cover_url || null);
  const badge = item.source || item.provider_name;
  const episodeCount = item.chapter_count || item.available_episodes;

  return (
    <Link href={href} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-[var(--dc-elevated)]">
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt={title}
            fill
            sizes="(max-width: 640px) 33vw, (max-width: 1024px) 20vw, 16vw"
            className="object-cover transition-all duration-300 group-hover:scale-105 group-hover:brightness-110"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <FilmIcon className="h-8 w-8 text-white/20" />
          </div>
        )}

        {badge && (
          <span
            className={`absolute left-1.5 top-1.5 rounded-md border px-1.5 py-0.5 text-[9px] font-medium ${providerBadgeColor(badge)}`}
          >
            {badge}
          </span>
        )}

        {episodeCount && episodeCount > 0 && (
          <span className="absolute bottom-1.5 right-1.5 rounded-md bg-black/70 px-1.5 py-0.5 text-[9px] font-medium text-white/80">
            {episodeCount} EP
          </span>
        )}

        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all group-hover:bg-black/30">
          <PlayIcon className="h-8 w-8 text-white opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
      </div>

      <p className="mt-1.5 truncate text-[12px] font-medium text-white/80 group-hover:text-white">
        {title}
      </p>
    </Link>
  );
}
