import { NextResponse } from "next/server";
import { getAnalytics, writeAnalytics } from "@/lib/admin/store";

export async function POST() {
  const analytics = await getAnalytics();
  const today = new Date().toISOString().slice(0, 10);
  analytics.visits[today] = (analytics.visits[today] || 0) + 1;
  await writeAnalytics(analytics);
  return NextResponse.json({ ok: true });
}
