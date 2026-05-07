"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchAnimeList } from "@/lib/api";
import ContentCard from "@/components/sections/ContentCard";
import { GridSkeleton } from "@/components/ui/Skeleton";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ#".split("");

export default function AnimeAZPage() {
  const [selected, setSelected] = useState("A");

  const { data, isLoading } = useQuery({
    queryKey: ["anime-az", selected],
    queryFn: () => fetchAnimeList({ per_page: 100, sort_by: "name" }),
  });

  const filtered = data?.data.filter((item) => {
    const first = (item.name || "")[0]?.toUpperCase() || "#";
    return selected === "#" ? !/[A-Z]/.test(first) : first === selected;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
      <h1 className="mb-6 text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>Anime A-Z</h1>
      <div className="mb-6 flex flex-wrap gap-1">
        {LETTERS.map((l) => (
          <button key={l} onClick={() => setSelected(l)}
            className={`h-9 w-9 rounded-lg text-[13px] font-medium ${selected === l ? "bg-[var(--dc-violet)]/15 text-[var(--dc-violet)]" : "text-white/40 hover:bg-white/[0.05]"}`}>
            {l}
          </button>
        ))}
      </div>
      {isLoading ? <GridSkeleton /> : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
          {filtered?.map((item) => <ContentCard key={item.id} item={item} href={`/anime/${item.id}`} />)}
        </div>
      )}
    </div>
  );
}
