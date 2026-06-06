"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { getLocalHistory, type LocalHistoryEntry } from "@/lib/local-history";

export default function DramaHistoryPage() {
  const [history, setHistory] = useState<LocalHistoryEntry[]>([]);

  useEffect(() => {
    setHistory(getLocalHistory());
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
      <h1 className="mb-6 text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
        Watch History
      </h1>

      {history.length === 0 ? (
        <p className="text-sm text-white/30">No watch history yet</p>
      ) : (
        <div className="space-y-2">
          {history.map((entry, i) => (
            <Link
              key={`${entry.content_id}-${entry.episode_number}-${i}`}
              href={`/drama/${entry.content_id}`}
              className="flex items-center gap-4 rounded-xl border border-white/[0.06] p-3 transition-colors hover:bg-white/[0.03]"
            >
              <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-lg">
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
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white/80">
                  {entry.content_name}
                </p>
                <p className="text-[11px] text-white/30">
                  EP {entry.episode_number} •{" "}
                  {entry.completed ? "Completed" : `${Math.round((entry.progress_seconds / Math.max(entry.duration_seconds, 1)) * 100)}%`}
                </p>
              </div>
              <div className="h-1 w-24 shrink-0 rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-[var(--dc-gold)]"
                  style={{
                    width: `${Math.min((entry.progress_seconds / Math.max(entry.duration_seconds, 1)) * 100, 100)}%`,
                  }}
                />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
