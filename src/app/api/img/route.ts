import { NextRequest, NextResponse } from "next/server";

// Whitelist of upstream thumbnail hosts allowed through the proxy.
// Add new hosts here as the API surfaces them. Wildcards via endsWith.
const ALLOWED_HOSTS = [
  "donghuastream.org",
  "otakudesu.blog",
  "komiku.org",
  "komiku.id",
  "imz.streamv.site",
  "i.imgur.com",
  "wp.com",
  "i0.wp.com",
  "i1.wp.com",
  "i2.wp.com",
  "i3.wp.com",
  "terbit21.com",
  "rebahin.is",
  "lk21.media",
  "drakorid.click",
  "drakorid.cc",
];

// Per-host Referer overrides. Some CDNs require a matching origin Referer
// (hotlink-protection in reverse) and return 403 without it. Match by
// host suffix; longest match wins. Default: no Referer header.
const REFERER_BY_HOST_SUFFIX: Record<string, string> = {
  "komiku.org": "https://komiku.org/",
  "komiku.id": "https://komiku.id/",
};

const TIMEOUT_MS = 15_000;
const MAX_BYTES = 8 * 1024 * 1024; // 8 MiB upper bound

function isAllowed(host: string): boolean {
  const h = host.toLowerCase();
  return ALLOWED_HOSTS.some((a) => h === a || h.endsWith(`.${a}`));
}

function refererFor(host: string): string | null {
  const h = host.toLowerCase();
  let best: { suffix: string; referer: string } | null = null;
  for (const [suffix, referer] of Object.entries(REFERER_BY_HOST_SUFFIX)) {
    if (h === suffix || h.endsWith(`.${suffix}`)) {
      if (!best || suffix.length > best.suffix.length) {
        best = { suffix, referer };
      }
    }
  }
  return best?.referer ?? null;
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "missing url" }, { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(url);
  } catch {
    return NextResponse.json({ error: "bad url" }, { status: 400 });
  }

  if (target.protocol !== "https:" && target.protocol !== "http:") {
    return NextResponse.json({ error: "scheme blocked" }, { status: 400 });
  }
  if (!isAllowed(target.hostname)) {
    return NextResponse.json({ error: "host not allowed" }, { status: 403 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const headers: Record<string, string> = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
      Accept: "image/avif,image/webp,image/png,image/jpeg,*/*;q=0.8",
    };

    // Most CDNs work with no Referer. A few (e.g. komiku) require their own
    // origin as Referer or they return 403. Apply a per-host override here.
    const referer = refererFor(target.hostname);
    if (referer) {
      headers.Referer = referer;
    }

    const upstream = await fetch(target.toString(), {
      headers,
      redirect: "follow",
      signal: controller.signal,
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `upstream ${upstream.status}` },
        { status: 502 },
      );
    }

    const contentType = upstream.headers.get("content-type") || "image/jpeg";
    if (!contentType.startsWith("image/")) {
      return NextResponse.json({ error: "not an image" }, { status: 502 });
    }

    const buf = await upstream.arrayBuffer();
    if (buf.byteLength > MAX_BYTES) {
      return NextResponse.json({ error: "too large" }, { status: 502 });
    }

    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, s-maxage=86400, immutable",
      },
    });
  } catch (err) {
    const aborted = (err as Error)?.name === "AbortError";
    return NextResponse.json(
      { error: aborted ? "timeout" : "fetch failed" },
      { status: 502 },
    );
  } finally {
    clearTimeout(timeout);
  }
}
