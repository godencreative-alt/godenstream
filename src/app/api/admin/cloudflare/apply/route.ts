import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAdminSettings, verifyAdminSession } from "@/lib/admin/store";

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  if (!verifyAdminSession(cookieStore.get("dramashort_admin")?.value)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const zoneId = process.env.CLOUDFLARE_ZONE_ID;
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (!zoneId || !token) {
    return NextResponse.json(
      { error: "Set CLOUDFLARE_ZONE_ID and CLOUDFLARE_API_TOKEN first." },
      { status: 400 },
    );
  }

  const settings = await getAdminSettings();
  const securityLevel = settings.cloudflare.ddosProtectionEnabled
    ? settings.cloudflare.challengeMode
    : "medium";
  const base = `https://api.cloudflare.com/client/v4/zones/${zoneId}/settings`;
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const [security, browserCheck, hotlink] = await Promise.all([
    fetch(`${base}/security_level`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ value: securityLevel }),
    }),
    fetch(`${base}/browser_check`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ value: "on" }),
    }),
    fetch(`${base}/hotlink_protection`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ value: "on" }),
    }),
  ]);

  if (!security.ok || !browserCheck.ok || !hotlink.ok) {
    return NextResponse.json({ error: "Cloudflare update failed" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
