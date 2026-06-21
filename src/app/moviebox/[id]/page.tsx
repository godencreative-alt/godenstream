import type { Metadata } from "next";
import MovieboxDetailClient from "./MovieboxDetailClient";

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

export default async function MovieboxDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <MovieboxDetailClient id={id} />;
}
