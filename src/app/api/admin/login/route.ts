import { NextRequest, NextResponse } from "next/server";
import { createAdminSession, verifyAdminPassword } from "@/lib/admin/store";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const username = String(form.get("username") || "");
  const password = String(form.get("password") || "");

  if (!(await verifyAdminPassword(username, password))) {
    return NextResponse.redirect(new URL("/admin/login?error=1", req.url), { status: 303 });
  }

  const session = createAdminSession(username);
  const res = NextResponse.redirect(new URL("/admin", req.url), { status: 303 });
  res.cookies.set(session.name, session.value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: session.maxAge,
    path: "/",
  });
  return res;
}
