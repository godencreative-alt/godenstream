"use client";

import { fetchDramaPopular } from "@/lib/api";
import InfiniteGrid from "@/components/sections/InfiniteGrid";

export default function DramaPopularPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
      <h1 className="mb-6 text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
        Popular Dramas
      </h1>
      <InfiniteGrid
        queryKey={["dramas-popular"]}
        queryFn={(page) =>
          fetchDramaPopular({ per_page: 24 }).then((res) => ({
            ...res,
            meta: { ...res.meta, page },
          }))
        }
        hrefPrefix="/drama"
      />
    </div>
  );
}
