import type { Metadata } from "next";
import { fetchMovieDetail } from "@/lib/api";
import { proxyThumbnail } from "@/lib/utils";
import MovieboxDetailClient from "./MovieboxDetailClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const res = await fetchMovieDetail(id);
    const movie = res.data;
    return {
      title: movie.title,
      description: movie.description || `Tonton ${movie.title} di GodenStream`,
      openGraph: {
        title: `${movie.title} | GodenStream`,
        description: movie.description || `Tonton ${movie.title} di GodenStream`,
        images: movie.thumbnail ? [{ url: proxyThumbnail(movie.thumbnail) ?? movie.thumbnail }] : [],
        type: "video.movie",
      },
    };
  } catch {
    return { title: "Movie" };
  }
}

export default async function MovieboxDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <MovieboxDetailClient id={id} />;
}
