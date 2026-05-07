"use client";

import { useEffect, useState } from "react";
import ContentCard from "@/components/sections/ContentCard";
import { getLocalBookmarks } from "@/lib/local-history";

export default function IqiyiBookmarksPage() {
  const [bk, setBk] = useState<{ id: string; title?: string; cover_url?: string }[]>([]);
  useEffect(() => { setBk(getLocalBookmarks() as typeof bk); }, []);
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
      <h1 className="mb-6 text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>Saved</h1>
      {bk.length === 0 ? <p className="text-sm text-white/30">Nothing saved</p> : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">{bk.map((i) => <ContentCard key={i.id} item={i} href={`/iqiyi/${i.id}`} />)}</div>
      )}
    </div>
  );
}
