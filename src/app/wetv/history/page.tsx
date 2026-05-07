"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getLocalHistory, type LocalHistoryEntry } from "@/lib/local-history";

export default function WetvHistoryPage() {
  const [h, setH] = useState<LocalHistoryEntry[]>([]);
  useEffect(() => { setH(getLocalHistory()); }, []);
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
      <h1 className="mb-6 text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>History</h1>
      {h.length === 0 ? <p className="text-sm text-white/30">No history</p> : (
        <div className="space-y-2">{h.map((e, i) => (
          <Link key={`${e.content_id}-${i}`} href={`/wetv/${e.content_id}/${e.episode_number}`} className="flex items-center gap-4 rounded-xl border border-white/[0.06] p-3 hover:bg-white/[0.03]">
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-white/80">{e.content_name}</p><p className="text-[11px] text-white/30">EP {e.episode_number}</p></div>
          </Link>
        ))}</div>
      )}
    </div>
  );
}
