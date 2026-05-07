"use client";

import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth";
import { fetchWatchHistory } from "@/lib/api";

interface ContinueWatchingProps {
  section?: string;
}

export default function ContinueWatching({ section = "drama" }: ContinueWatchingProps) {
  const user = useAuthStore((s) => s.user);
  const { data } = useQuery({
    queryKey: ["watch-history", section],
    queryFn: () => fetchWatchHistory({ per_page: 20 }),
    enabled: !!user,
  });

  if (!user || !data?.data?.length) return null;

  return (
    <section className="mb-8">
      <h2 className="mb-3 text-base font-semibold text-white">
        Continue Watching
      </h2>
      <div className="no-scrollbar flex gap-3 overflow-x-auto">
        {data.data.map((entry) => (
          <Link
            key={entry.id}
            href={`/${section}/${entry.drama_id}/${entry.episode_index}`}
            className="group w-28 shrink-0 sm:w-32"
          >
            <div className="relative aspect-[3/4] overflow-hidden rounded-xl">
              {entry.drama_cover_url ? (
                <Image
                  src={entry.drama_cover_url}
                  alt={entry.drama_title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="h-full w-full bg-[var(--dc-elevated)]" />
              )}

              <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
                <div
                  className="h-full rounded-full bg-[var(--dc-gold)]"
                  style={{
                    width: `${Math.min((entry.progress_seconds / Math.max(entry.duration_seconds, 1)) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>

            <p className="mt-1 truncate text-[11px] text-white/70">
              {entry.drama_title}
            </p>
            <p className="text-[10px] text-white/30">EP {entry.episode_index}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
