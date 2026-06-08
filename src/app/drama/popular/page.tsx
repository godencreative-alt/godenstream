"use client";

import InfiniteGrid from "@/components/sections/InfiniteGrid";
import { fetchDracinPopular, toPaginated } from "@/lib/api";

export default function DramaPopularPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
      <header className="mb-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[var(--dc-rose)]">
          Short Drama
        </p>
        <h1
          className="text-3xl font-bold text-white md:text-4xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Drama Populer
        </h1>
      </header>

      <InfiniteGrid
        queryKey={["drama-popular-infinite"]}
        queryFn={(page) =>
          fetchDracinPopular(page).then((r) => ({
            ...toPaginated(r, page),
            data: r.data.map((item) => ({
              ...item,
              id: item.slug ?? "",
              cover_url: item.thumbnail,
            })),
          }))
        }
        hrefPrefix="/drama"
        emptyMessage="Konten drama belum tersedia"
      />
    </div>
  );
}
