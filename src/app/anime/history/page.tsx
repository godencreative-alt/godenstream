"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { getLocalHistory, type LocalHistoryEntry } from "@/lib/local-history";

export default function AnimeHistoryPage() {
  const [history, setHistory] = useState<LocalHistoryEntry[]>([]);
  useEffect(() => { setHistory(getLocalHistory()); }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
      <h1 className="mb-6 text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>Anime History</h1>
      {history.length === 0 ? <p className="text-sm text-white/30">No watch history</p> : (
        <div className="space-y-2">
          {history.map((e, i) => (
            <Link key={`${e.content_id}-${i}`} href={`/anime/${e.content_id}/${e.episode_number}`}
              className="flex items-center gap-4 rounded-xl border border-white/[0.06] p-3 hover:bg-white/[0.03]">
              <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-lg">
                {e.cover_url ? <Image src={e.cover_url} alt={e.content_name} fill className="object-cover" /> : <div className="h-full w-full bg-[var(--dc-elevated)]" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white/80">{e.content_name}</p>
                <p className="text-[11px] text-white/30">EP {e.episode_number}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
