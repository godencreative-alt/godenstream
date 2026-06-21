import type { Metadata } from "next";
import { fetchComicDetail } from "@/lib/api";
import { proxyThumbnail } from "@/lib/utils";
import ComicDetailClient from "./ComicDetailClient";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ type?: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const sp = await searchParams;
  const type = sp.type || "manga";
  try {
    const res = await fetchComicDetail(id, { type });
    const item = res.data;
    return {
      title: item.title,
      description: item.description || `Baca ${item.title} di GodenStream`,
      openGraph: {
        title: `${item.title} | GodenStream`,
        description: item.description || `Baca ${item.title} di GodenStream`,
        images: item.thumbnail ? [{ url: proxyThumbnail(item.thumbnail) ?? item.thumbnail }] : [],
        type: "book",
      },
    };
  } catch {
    return { title: "Comic" };
  }
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
  let initialData = null;
  try {
    const res = await fetchComicDetail(id, { type });
    initialData = res;
  } catch { /* handled by generateMetadata */ }
  return <ComicDetailClient id={id} type={type} initialData={initialData} />;
}
