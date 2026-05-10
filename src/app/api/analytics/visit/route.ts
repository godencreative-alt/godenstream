import { NextResponse } from "next/server";
import { updateAnalytics } from "@/lib/admin/store";

export async function POST() {
  const today = new Date().toISOString().slice(0, 10);
  await updateAnalytics((analytics) => {
    analytics.visits[today] = (analytics.visits[today] || 0) + 1;
  });
  return NextResponse.json({ ok: true });
}
