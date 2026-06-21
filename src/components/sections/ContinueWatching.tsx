"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { PlayIcon } from "@heroicons/react/24/solid";
import {
  getLocalHistory,
  type LocalHistoryEntry,
} from "@/lib/local-history";

/** Section prefix → URL prefix mapping for building resume links. */
const SECTION_URL: Record<string, string> = {
  anime: "/anime",
  donghua: "/donghua",
  moviebox: "/moviebox",
  entertainment: "/entertainment",
  comic: "/comic",
};

function inferSection(entry: LocalHistoryEntry): string {
  // Try to detect section from the content_id or episode_slug
  for (const key of Object.keys(SECTION_URL)) {
    if (entry.content_id.startsWith(`${key}:`)) return key;
  }
  // Default fallback: use the raw content_id as path segment
  return "anime";
}

export default function ContinueWatching() {
  const [entries, setEntries] = useState<LocalHistoryEntry[]>([]);

  useEffect(() => {
    const history = getLocalHistory()
      .filter((e) => !e.completed)
      .slice(0, 12);
    setEntries(history);
  }, []);

  if (entries.length === 0) return null;

  return (
    <section className="mb-10">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-white/25">
            Resume
          </p>
          <h2
            className="text-xl font-bold text-white"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Continue Watching
          </h2>
        </div>
      </div>
      <div className="no-scrollbar flex gap-3 overflow-x-auto pb-2">
        {entries.map((entry) => {
          const progress =
            entry.duration_seconds > 0
              ? Math.min(
                  (entry.progress_seconds / entry.duration_seconds) * 100,
                  100,
                )
              : 0;

          const section = inferSection(entry);
          const urlPrefix = SECTION_URL[section] ?? `/${section}`;
          const contentSlug = entry.content_id.replace(/^[^:]+:/, "");
          const href = entry.episode_slug
            ? `${urlPrefix}/${encodeURIComponent(contentSlug)}/${encodeURIComponent(entry.episode_slug)}`
            : `${urlPrefix}/${encodeURIComponent(contentSlug)}`;

          return (
            <Link
              key={`${entry.content_id}-${entry.episode_slug ?? entry.episode_number}`}
              href={href}
              className="group w-32 shrink-0 sm:w-36"
            >
              <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-[var(--dc-elevated)]">
                {entry.cover_url ? (
                  <Image
                    src={entry.cover_url}
                    alt={entry.content_name}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                    sizes="128px"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <PlayIcon className="h-6 w-6 text-white/20" />
                  </div>
                )}

                {/* Play overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all group-hover:bg-black/30">
                  <PlayIcon className="h-6 w-6 text-white opacity-0 transition-opacity group-hover:opacity-100" />
                </div>

                {/* Progress bar */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
                  <div
                    className="h-full rounded-full bg-[var(--dc-gold)]"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <p className="mt-1.5 truncate text-[11px] font-medium text-white/70 group-hover:text-white">
                {entry.content_name}
              </p>
              <p className="text-[10px] text-white/30">
                EP {entry.episode_number} &middot; {Math.round(progress)}%
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
