import type { Metadata } from "next";
import DonghuaDetailClient from "./DonghuaDetailClient";

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

export default async function DonghuaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DonghuaDetailClient id={id} />;
}
