import { NextRequest, NextResponse } from "next/server";
import { getAnalytics, writeAnalytics } from "@/lib/admin/store";

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

  const analytics = await getAnalytics();
  const existing = analytics.watches[payload.key];
  analytics.watches[payload.key] = {
    key: payload.key,
    title: payload.title.slice(0, 300),
    providerName: payload.providerName.slice(0, 120),
    providerSlug: payload.providerSlug.slice(0, 120),
    coverUrl: payload.coverUrl || null,
    href: payload.href || "/",
    count: (existing?.count || 0) + 1,
    lastWatchedAt: new Date().toISOString(),
  };
  await writeAnalytics(analytics);

  return NextResponse.json({ ok: true });
}
