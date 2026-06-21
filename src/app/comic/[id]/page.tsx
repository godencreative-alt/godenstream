import type { Metadata } from "next";
import ComicDetailClient from "./ComicDetailClient";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ type?: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const fallbackTitle = id.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  return {
    title: fallbackTitle,
    description: `Baca ${fallbackTitle} di GodenStream`,
  };
}

export default async function ComicDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ type?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const type = sp.type || "manga";
  return <ComicDetailClient id={id} type={type} />;
}
