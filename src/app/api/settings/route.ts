import { NextResponse } from "next/server";
import { getPublicSettings } from "@/lib/admin/store";

export async function GET() {
  return NextResponse.json(await getPublicSettings());
}
