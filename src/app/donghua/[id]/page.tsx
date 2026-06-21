import type { Metadata } from "next";
import { fetchDonghuaDetail } from "@/lib/api";
import { proxyThumbnail } from "@/lib/utils";
import DonghuaDetailClient from "./DonghuaDetailClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const res = await fetchDonghuaDetail(id);
    const item = res.data;
    return {
      title: item.title,
      description: item.description || `Tonton ${item.title} di GodenStream`,
      openGraph: {
        title: `${item.title} | GodenStream`,
        description: item.description || `Tonton ${item.title} di GodenStream`,
        images: item.thumbnail ? [{ url: proxyThumbnail(item.thumbnail) ?? item.thumbnail }] : [],
        type: "video.tv_show",
      },
    };
  } catch {
    return { title: "Donghua" };
  }
}

export default async function DonghuaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let initialData = null;
  try {
    const res = await fetchDonghuaDetail(id);
    initialData = res;
  } catch { /* handled by generateMetadata */ }
  return <DonghuaDetailClient id={id} initialData={initialData} />;
}
