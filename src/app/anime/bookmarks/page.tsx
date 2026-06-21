"use client";

import { useEffect, useState } from "react";
import ContentCard from "@/components/sections/ContentCard";
import { getLocalBookmarks } from "@/lib/local-history";

interface BookmarkEntry {
  id: string;
  section?: string;
  slug?: string;
  title?: string;
  thumbnail?: string | null;
  /* legacy fields */
  name?: string;
  cover_url?: string;
}

export default function AnimeBookmarksPage() {
  const [bookmarks, setBookmarks] = useState<BookmarkEntry[]>([]);
  useEffect(() => {
    const all = getLocalBookmarks() as BookmarkEntry[];
    setBookmarks(all.filter((b) => b.section === "anime" || b.id.startsWith("anime:")));
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
      <h1 className="mb-6 text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>Saved Anime</h1>
      {bookmarks.length === 0 ? <p className="text-sm text-white/30">No saved anime yet</p> : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
          {bookmarks.map((item) => {
            const slug = item.slug ?? item.id.replace(/^anime:/, "");
            return (
              <ContentCard
                key={item.id}
                item={{ title: item.title || item.name, thumbnail: item.thumbnail || item.cover_url }}
                href={`/anime/${encodeURIComponent(slug)}`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
