import { NextRequest, NextResponse } from "next/server";

const UPSTREAM = process.env.UPSTREAM_API_URL || "https://api.godenpg.dev";
const GODEN_API_KEY = process.env.GODEN_API_KEY || process.env.API_KEY;

const CONTENT_PREFIXES = [
  "/api/v1/anime",
  "/api/v1/movie",
  "/api/v1/adult",
  "/api/v1/entertainment",
  "/api/v1/drama",
  "/api/v1/comic",
  "/api/v1/donghua",
  "/api/v1/asset",
] as const;

const AUTH_PREFIX = "/api/v1/auth";

const ALLOWED_PREFIXES = [...CONTENT_PREFIXES, AUTH_PREFIX];

function isContentPath(path: string): boolean {
  return CONTENT_PREFIXES.some((p) => path.startsWith(p));
}

function isAuthPath(path: string): boolean {
  return path.startsWith(AUTH_PREFIX);
}

const RL_MAP = new Map<string, { count: number; reset: number }>();

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
  const entry = RL_MAP.get(ip);

  if (!entry || now > entry.reset) {
    RL_MAP.set(ip, { count: 1, reset: now + 60_000 });
    return true;
  }

  if (entry.count >= 120) return false;
  entry.count++;
  return true;
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

  const headers: Record<string, string> = {};

  const incomingContentType = req.headers.get("content-type");
  const hasBody = req.method !== "GET" && req.method !== "HEAD";
  if (hasBody && incomingContentType) {
    headers["Content-Type"] = incomingContentType;
  }

  if (isContentPath(upstreamPath)) {
    if (!GODEN_API_KEY) {
      return NextResponse.json(
        { error: "Server is missing GODEN_API_KEY" },
        { status: 503 },
      );
    }
    headers["X-API-Key"] = GODEN_API_KEY;
  }

  if (isAuthPath(upstreamPath)) {
    const authHeader = req.headers.get("authorization");
    if (authHeader) {
      headers["Authorization"] = authHeader;
    }
  }

  const deviceId = req.headers.get("x-device-id");
  if (deviceId) {
    headers["X-Device-Id"] = deviceId;
  }

  try {
    const isAsset = upstreamPath.startsWith("/api/v1/asset");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);

    // Asset endpoints (thumbnails) lazy-fetch+cache on the upstream's first
    // hit and frequently 502 mid-bake. Retry once with a short backoff so
    // page grids don't show broken images on cold cache.
    const requestBody =
      req.method !== "GET" && req.method !== "HEAD" ? await req.text() : undefined;

    const doFetch = () =>
      fetch(upstreamUrl, {
        method: req.method,
        headers,
        body: requestBody,
        signal: controller.signal,
      });

    let upstream = await doFetch();
    if (isAsset && upstream.status >= 502 && upstream.status <= 504) {
      await new Promise((r) => setTimeout(r, 250));
      upstream = await doFetch();
    }

    clearTimeout(timeout);

    const responseHeaders = new Headers();
    upstream.headers.forEach((value, key) => {
      if (!STRIP_HEADERS.has(key.toLowerCase())) {
        responseHeaders.set(key, value);
      }
    });

    // Tell the browser/CDN to cache thumbnails aggressively so we only pay
    // the upstream cold-fetch latency once per asset.
    if (isAsset && upstream.ok) {
      responseHeaders.set(
        "Cache-Control",
        "public, max-age=86400, s-maxage=604800, immutable",
      );
    } else if (
      isContentPath(upstreamPath) &&
      req.method === "GET" &&
      upstream.ok
    ) {
      // Content list/detail JSON is slow to regenerate upstream (cold scrape
      // can take 5-9s). Short browser cache + SWR keeps navigation snappy
      // without serving very stale data.
      responseHeaders.set(
        "Cache-Control",
        "public, max-age=300, s-maxage=600, stale-while-revalidate=86400",
      );
    }

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
