import type { Metadata } from "next";
import AnimeDetailClient from "./AnimeDetailClient";

// Skip server-side fetch — backend detail endpoints are slow (15s+ timeout).
// Client fetches via /api/proxy which has caching.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const fallbackTitle = id.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  return {
    title: fallbackTitle,
    description: `Tonton ${fallbackTitle} di GodenStream`,
  };
}

export default async function AnimeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AnimeDetailClient id={id} />;
}
