"use client";

import { fetchWetvList } from "@/lib/api";
import InfiniteGrid from "@/components/sections/InfiniteGrid";

export default function WetvBrowsePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
      <h1 className="mb-6 text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>Browse WeTV</h1>
      <InfiniteGrid queryKey={["wetv-browse"]} queryFn={(page) => fetchWetvList({ page, per_page: 24 })} hrefPrefix="/wetv" />
    </div>
  );
}
