import type { Metadata } from "next";
import { fetchAnimeDetail } from "@/lib/api";
import { proxyThumbnail } from "@/lib/utils";
import AnimeDetailClient from "./AnimeDetailClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const res = await fetchAnimeDetail(id);
    const anime = res.data;
    return {
      title: anime.title,
      description: anime.synopsis || `Tonton ${anime.title} di GodenStream`,
      openGraph: {
        title: `${anime.title} | GodenStream`,
        description: anime.synopsis || `Tonton ${anime.title} di GodenStream`,
        images: anime.thumbnail ? [{ url: proxyThumbnail(anime.thumbnail) ?? anime.thumbnail }] : [],
        type: "video.tv_show",
      },
    };
  } catch {
    return { title: "Anime" };
  }
}

export default async function AnimeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AnimeDetailClient id={id} />;
}
