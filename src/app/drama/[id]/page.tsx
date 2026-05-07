import { Suspense } from "react";
import type { Metadata } from "next";
import DramaDetailClient from "./DetailClient";
import { Spinner } from "@/components/ui/Spinner";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Drama ${id}`,
    openGraph: { title: `Drama ${id}` },
  };
}

export default async function DramaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <Spinner size="lg" />
        </div>
      }
    >
      <DramaDetailClient id={id} />
    </Suspense>
  );
}
