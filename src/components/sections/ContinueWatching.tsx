"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  getLocalHistory,
  type LocalHistoryEntry,
} from "@/lib/local-history";

interface ContinueWatchingProps {
  section?: "drama" | "anime" | "moviebox";
}

export default function ContinueWatching({
  section = "drama",
}: ContinueWatchingProps) {
  const [entries, setEntries] = useState<LocalHistoryEntry[]>([]);

  useEffect(() => {
    setEntries(getLocalHistory().slice(0, 12));
  }, []);

  if (entries.length === 0) return null;

  return (
    <section className="mb-8">
      <h2 className="mb-3 text-base font-semibold text-white">
        Continue Watching
      </h2>
      <div className="no-scrollbar flex gap-3 overflow-x-auto">
        {entries.map((entry) => {
          const progress =
            entry.duration_seconds > 0
              ? Math.min(
                  (entry.progress_seconds / entry.duration_seconds) * 100,
                  100,
                )
              : 0;
          return (
            <Link
              key={`${entry.content_id}-${entry.episode_number}`}
              href={`/${section}/${encodeURIComponent(entry.content_id)}${entry.episode_slug ? `/${encodeURIComponent(entry.episode_slug)}` : ""}`}
              className="group w-28 shrink-0 sm:w-32"
            >
              <div className="relative aspect-[3/4] overflow-hidden rounded-xl">
                {entry.cover_url ? (
                  <Image
                    src={entry.cover_url}
                    alt={entry.content_name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-[var(--dc-elevated)]" />
                )}

                <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
                  <div
                    className="h-full rounded-full bg-[var(--dc-gold)]"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <p className="mt-1 truncate text-[11px] text-white/70">
                {entry.content_name}
              </p>
              <p className="text-[10px] text-white/30">
                EP {entry.episode_number}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
