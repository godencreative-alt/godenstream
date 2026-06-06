"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { fetchAdultLatest } from "@/lib/api";
import ContentCard from "@/components/sections/ContentCard";
import { GridSkeleton } from "@/components/ui/Skeleton";

const AGE_KEY = "godenstream_age_ok";

function AgeGate({ onConfirm }: { onConfirm: () => void }) {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <h1
        className="text-2xl font-bold"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Konten 18+
      </h1>
      <p className="text-sm text-white/55">
        Bahagian ini mengandungi kandungan dewasa. Anda mesti berumur 18 tahun
        ke atas untuk meneruskan.
      </p>
      <div className="mt-2 flex gap-3">
        <button
          type="button"
          onClick={onConfirm}
          className="rounded-xl bg-[var(--dc-rose)] px-5 py-2.5 text-sm font-semibold text-white hover:brightness-110"
        >
          Saya 18+, Teruskan
        </button>
        <Link
          href="/"
          className="rounded-xl border border-white/[0.08] px-5 py-2.5 text-sm text-white/60 hover:text-white"
        >
          Batal
        </Link>
      </div>
    </div>
  );
}

export default function AdultHomePage() {
  const [ok, setOk] = useState<boolean | null>(null);

  useEffect(() => {
    setOk(localStorage.getItem(AGE_KEY) === "1");
  }, []);

  const { data: p1, isLoading } = useQuery({
    queryKey: ["adult-latest", 1],
    queryFn: () => fetchAdultLatest(1),
    enabled: ok === true,
  });

  const { data: p2 } = useQuery({
    queryKey: ["adult-latest", 2],
    queryFn: () => fetchAdultLatest(2),
    enabled: ok === true,
  });

  if (ok === null) return null;
  if (!ok) {
    return (
      <AgeGate
        onConfirm={() => {
          localStorage.setItem(AGE_KEY, "1");
          setOk(true);
        }}
      />
    );
  }

  const grid = [...(p1?.data ?? []), ...(p2?.data ?? [])];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
      <header className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[var(--dc-rose)]">
            18+
          </p>
          <h1
            className="text-3xl font-bold text-white md:text-4xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Adult
          </h1>
        </div>
        <Link
          href="/adult/search"
          className="shrink-0 rounded-full border border-white/[0.08] px-3 py-1.5 text-xs font-semibold text-white/60 hover:text-white"
        >
          Cari
        </Link>
      </header>

      {isLoading ? (
        <GridSkeleton />
      ) : grid.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6">
          {grid.map((item) => (
            <ContentCard
              key={item.video_id ?? item.slug}
              item={item}
              href={`/adult/${encodeURIComponent(item.video_id ?? "")}`}
            />
          ))}
        </div>
      ) : (
        <div className="flex min-h-[40vh] items-center justify-center rounded-2xl border border-white/[0.06]">
          <p className="text-sm text-white/35">Tidak ada konten</p>
        </div>
      )}
    </div>
  );
}
