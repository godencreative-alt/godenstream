"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { fetchSearch } from "@/lib/api";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import ContentCard from "@/components/sections/ContentCard";
import { GridSkeleton } from "@/components/ui/Skeleton";
import { Spinner } from "@/components/ui/Spinner";

function SearchContent() {
  const sp = useSearchParams();
  const [query, setQuery] = useState(sp.get("q") || "");
  const [dq, setDq] = useState(query);
  useEffect(() => { const t = setTimeout(() => setDq(query), 400); return () => clearTimeout(t); }, [query]);
  const { data, isLoading } = useQuery({ queryKey: ["moviebox-search", dq], queryFn: () => fetchSearch(dq), enabled: dq.length >= 2 });

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
      <h1 className="mb-6 text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>Search MovieBox</h1>
      <div className="relative mb-6 max-w-lg">
        <MagnifyingGlassIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/30" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} className="h-12 w-full rounded-xl bg-white/[0.04] border border-white/[0.08] pl-12 pr-4 text-sm text-white placeholder:text-white/25 focus:border-white/20 focus:outline-none" placeholder="Search..." autoFocus />
      </div>
      {dq.length < 2 ? <p className="text-sm text-white/30">Type at least 2 characters</p>
        : isLoading ? <GridSkeleton />
        : data?.data?.length ? <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">{data.data.map((i) => <ContentCard key={i.id} item={i} href={`/moviebox/${i.id}`} />)}</div>
        : <p className="text-sm text-white/30">No results</p>}
    </div>
  );
}

export default function MovieBoxSearchPage() {
  return <Suspense fallback={<div className="flex justify-center py-20"><Spinner size="lg" /></div>}><SearchContent /></Suspense>;
}
