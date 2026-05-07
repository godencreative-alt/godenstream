"use client";

import { fetchIqiyiList } from "@/lib/api";
import InfiniteGrid from "@/components/sections/InfiniteGrid";

export default function IqiyiBrowsePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
      <h1 className="mb-6 text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>Browse iQIYI</h1>
      <InfiniteGrid queryKey={["iqiyi-browse"]} queryFn={(page) => fetchIqiyiList({ page, per_page: 24 })} hrefPrefix="/iqiyi" />
    </div>
  );
}
