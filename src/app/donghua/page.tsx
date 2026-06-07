"use client";

import InfiniteGrid from "@/components/sections/InfiniteGrid";
import { fetchDonghuaLatest, toPaginated } from "@/lib/api";

export default function DonghuaHomePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
      <header className="mb-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[var(--dc-cyan)]">
          Donghua
        </p>
        <h1
          className="text-3xl font-bold text-white md:text-4xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Donghua Terbaru
        </h1>
      </header>

      <InfiniteGrid
        queryKey={["donghua-latest-infinite"]}
        queryFn={(page) =>
          fetchDonghuaLatest(page).then((r) => ({
            ...toPaginated(r, page),
            data: r.data.map((item) => ({
              ...item,
              id: item.slug ?? "",
              cover_url: item.thumbnail,
            })),
          }))
        }
        hrefPrefix="/donghua"
        emptyMessage="Konten donghua belum tersedia"
      />
    </div>
  );
}
