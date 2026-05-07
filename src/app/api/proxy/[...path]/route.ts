import { NextRequest, NextResponse } from "next/server";

const UPSTREAM = process.env.UPSTREAM_API_URL || "https://captain.sapimu.au";
const DEFAULT_API_KEY = process.env.API_KEY;

const ALLOWED_PREFIXES = [
  "/api/dramas",
  "/api/search",
  "/api/providers",
  "/api/tags",
  "/api/anime",
  "/api/moviebox",
  "/api/iqiyi",
  "/api/wetv",
  "/api/auth",
  "/api/user",
  "/api/comments",
  "/idrama",
  "/dramaboxv4",
  "/melolo",
  "/netshort",
  "/dramanova",
];

const RL_MAP = new Map<string, { count: number; reset: number }>();
const RL_MAX_ENTRIES = 10_000;

const STRIP_HEADERS = new Set([
  "x-powered-by",
  "server",
  "x-runtime",
  "x-request-id",
  "cf-ray",
  "cf-cache-status",
  "content-encoding",
  "content-length",
]);

function isAllowed(path: string): boolean {
  return ALLOWED_PREFIXES.some((p) => path.startsWith(p));
}

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  cleanupRateLimitEntries(now);
  const entry = RL_MAP.get(ip);

  if (!entry || now > entry.reset) {
    RL_MAP.set(ip, { count: 1, reset: now + 60_000 });
    return true;
  }

  if (entry.count >= 120) return false;
  entry.count++;
  return true;
}

function cleanupRateLimitEntries(now: number) {
  if (RL_MAP.size <= RL_MAX_ENTRIES) return;

  for (const [ip, entry] of RL_MAP) {
    if (now > entry.reset) RL_MAP.delete(ip);
  }

  while (RL_MAP.size > RL_MAX_ENTRIES) {
    const oldestIp = RL_MAP.keys().next().value;
    if (!oldestIp) break;
    RL_MAP.delete(oldestIp);
  }
}

async function handler(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const upstreamPath = "/" + path.join("/");

  if (!isAllowed(upstreamPath)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const ip = getClientIp(req);
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      { status: 429 },
    );
  }

  const url = new URL(req.url);
  const upstreamUrl = `${UPSTREAM}${upstreamPath}${url.search}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const authHeader = req.headers.get("authorization");
  if (authHeader) {
    headers["Authorization"] = authHeader;
  }

  if (DEFAULT_API_KEY && !authHeader) {
    headers["Authorization"] = `Bearer ${DEFAULT_API_KEY}`;
  }

  if (DEFAULT_API_KEY) {
    headers["Cookie"] = `auth_token=${DEFAULT_API_KEY}`;
  }

  const deviceId = req.headers.get("x-device-id");
  if (deviceId) {
    headers["X-Device-Id"] = deviceId;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);

    const upstream = await fetch(upstreamUrl, {
      method: req.method,
      headers,
      body: req.method !== "GET" && req.method !== "HEAD" ? await req.text() : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const responseHeaders = new Headers();
    upstream.headers.forEach((value, key) => {
      if (!STRIP_HEADERS.has(key.toLowerCase())) {
        responseHeaders.set(key, value);
      }
    });

    const body = await upstream.arrayBuffer();
    return new NextResponse(body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch {
    return NextResponse.json(
      { error: "Upstream request failed" },
      { status: 502 },
    );
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
