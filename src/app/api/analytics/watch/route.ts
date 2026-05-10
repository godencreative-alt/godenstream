import { NextRequest, NextResponse } from "next/server";
import { updateAnalytics } from "@/lib/admin/store";

interface WatchPayload {
  key?: string;
  title?: string;
  providerName?: string;
  providerSlug?: string;
  coverUrl?: string | null;
  href?: string;
}

export async function POST(req: NextRequest) {
  const payload = (await req.json().catch(() => ({}))) as WatchPayload;
  if (!payload.key || !payload.title || !payload.providerName || !payload.providerSlug) {
    return NextResponse.json({ error: "Invalid watch payload" }, { status: 400 });
  }
  const key = payload.key;
  const title = payload.title;
  const providerName = payload.providerName;
  const providerSlug = payload.providerSlug;

  await updateAnalytics((analytics) => {
    const existing = analytics.watches[key];
    analytics.watches[key] = {
      key,
      title: title.slice(0, 300),
      providerName: providerName.slice(0, 120),
      providerSlug: providerSlug.slice(0, 120),
      coverUrl: payload.coverUrl || null,
      href: payload.href || "/",
      count: (existing?.count || 0) + 1,
      lastWatchedAt: new Date().toISOString(),
    };
  });

  return NextResponse.json({ ok: true });
}
