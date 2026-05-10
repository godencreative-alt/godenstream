import { NextRequest, NextResponse } from "next/server";
import { getCachedMedia } from "@/lib/admin/cache";

const ALLOWED_MEDIA_HOSTS = [
  "idram",
  "dramabox",
  "fizzopic",
  "netshort",
  "cashdrama",
  "bilitv",
  "shorttv",
  "velolo",
  "janzhoutec",
  "farsunpteltd",
  "mydramawave",
  "yfeitrade",
];

function isAllowedMediaUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return false;
    return ALLOWED_MEDIA_HOSTS.some((part) => url.hostname.includes(part));
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url || !isAllowedMediaUrl(url)) {
    return NextResponse.json({ error: "Invalid media URL" }, { status: 400 });
  }

  const cached = await getCachedMedia(url);
  if (!cached) return NextResponse.json({ error: "Unable to cache media" }, { status: 502 });

  return new NextResponse(cached.body, {
    headers: {
      "Content-Type": cached.contentType,
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      "X-DramaShort-Cache-Key": cached.key,
      ...(cached.publicUrl ? { "X-DramaShort-R2-Url": cached.publicUrl } : {}),
    },
  });
}
