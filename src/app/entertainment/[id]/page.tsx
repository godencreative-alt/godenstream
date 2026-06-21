import type { Metadata } from "next";
import { fetchEntertainmentDetail } from "@/lib/api";
import { proxyThumbnail } from "@/lib/utils";
import EntertainmentDetailClient from "./EntertainmentDetailClient";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ subcategory?: string; type?: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const sp = await searchParams;
  const subcategory = sp.subcategory ?? "movie";
  const type = sp.type;
  try {
    const res = await fetchEntertainmentDetail(id, subcategory, type);
    const detail = res.data;
    return {
      title: detail.title,
      description: detail.description || `Tonton ${detail.title} di GodenStream`,
      openGraph: {
        title: `${detail.title} | GodenStream`,
        description: detail.description || `Tonton ${detail.title} di GodenStream`,
        images: detail.thumbnail ? [{ url: proxyThumbnail(detail.thumbnail) ?? detail.thumbnail }] : [],
        type: "video.movie",
      },
    };
  } catch {
    return { title: "Entertainment" };
  }
}

export default async function EntertainmentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ subcategory?: string; type?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const subcategory = sp.subcategory ?? "movie";
  let initialData = null;
  try {
    const res = await fetchEntertainmentDetail(id, subcategory, sp.type);
    initialData = res;
  } catch { /* handled by generateMetadata */ }
  return (
    <EntertainmentDetailClient
      id={id}
      subcategory={subcategory}
      type={sp.type}
      initialData={initialData}
    />
  );
}
