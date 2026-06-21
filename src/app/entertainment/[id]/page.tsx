import type { Metadata } from "next";
import { proxyThumbnail } from "@/lib/utils";
import EntertainmentDetailClient from "./EntertainmentDetailClient";

// Skip server-side fetch to avoid blocking page render on slow backend.
// Client component fetches data via /api/proxy which has caching.
// generateMetadata is optional — falls back to generic title if fetch fails.
export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ subcategory?: string; type?: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const sp = await searchParams;
  // Use slug as fallback title (humanize it)
  const fallbackTitle = id.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  return {
    title: fallbackTitle,
    description: `Tonton ${fallbackTitle} di GodenStream`,
  };
}

export default async function EntertainmentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ subcategory?: string; type?: string; embed?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const subcategory = sp.subcategory ?? "movie";
  return (
    <EntertainmentDetailClient
      id={id}
      subcategory={subcategory}
      type={sp.type}
      embedUrl={sp.embed}
    />
  );
}
