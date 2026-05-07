"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchAlphabetCounts, fetchAlphabetDramas } from "@/lib/api";
import ContentCard from "@/components/sections/ContentCard";
import { GridSkeleton } from "@/components/ui/Skeleton";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ#".split("");

export default function DramaAZPage() {
  const [selected, setSelected] = useState("A");

  const { data: counts } = useQuery({
    queryKey: ["alpha-counts"],
    queryFn: fetchAlphabetCounts,
  });

  const { data: dramas, isLoading } = useQuery({
    queryKey: ["alpha-dramas", selected],
    queryFn: () => fetchAlphabetDramas(selected),
    enabled: !!selected,
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
      <h1 className="mb-6 text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
        Browse A-Z
      </h1>

      <div className="mb-6 flex flex-wrap gap-1">
        {LETTERS.map((letter) => {
          const count = counts?.[letter] ?? 0;
          const disabled = count === 0;
          return (
            <button
              key={letter}
              onClick={() => !disabled && setSelected(letter)}
              disabled={disabled}
              className={`h-9 w-9 rounded-lg text-[13px] font-medium transition-colors ${
                selected === letter
                  ? "bg-[var(--dc-gold)]/15 text-[var(--dc-gold)]"
                  : disabled
                    ? "text-white/10 cursor-not-allowed"
                    : "text-white/40 hover:bg-white/[0.05] hover:text-white/60"
              }`}
            >
              {letter}
              {!disabled && count > 0 && (
                <span className="block text-[8px] text-white/20">{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <GridSkeleton />
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
          {dramas?.map((item) => (
            <ContentCard key={item.id} item={item} href={`/drama/${item.id}`} />
          ))}
        </div>
      )}
    </div>
  );
}
