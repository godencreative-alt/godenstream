"use client";

import { useEffect, useState } from "react";
import ContentCard from "@/components/sections/ContentCard";
import { getLocalBookmarks } from "@/lib/local-history";

export default function AnimeBookmarksPage() {
  const [bookmarks, setBookmarks] = useState<{ id: string; name?: string; cover_url?: string }[]>([]);
  useEffect(() => { setBookmarks(getLocalBookmarks() as typeof bookmarks); }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
      <h1 className="mb-6 text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>Saved Anime</h1>
      {bookmarks.length === 0 ? <p className="text-sm text-white/30">No saved anime yet</p> : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
          {bookmarks.map((item) => <ContentCard key={item.id} item={item} href={`/anime/${item.id}`} />)}
        </div>
      )}
    </div>
  );
}
