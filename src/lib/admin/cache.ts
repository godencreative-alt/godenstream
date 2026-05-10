import "server-only";
import { mkdir, readdir, readFile, stat, unlink, writeFile } from "fs/promises";
import path from "path";
import { createHash, createHmac } from "crypto";
import { getAdminSettings, getCacheUsageBytes } from "./store";

const CACHE_DIR =
  process.env.DRAMASHORT_CACHE_DIR ||
  path.join(/*turbopackIgnore: true*/ process.cwd(), ".dramashort-cache", "media");

function safeCacheName(url: string) {
  const parsed = new URL(url);
  const ext = path.extname(parsed.pathname).slice(0, 12) || ".bin";
  return `${createHash("sha256").update(url).digest("hex")}${ext}`;
}

async function pruneOldEntries(retentionDays: number) {
  try {
    const entries = await readdir(CACHE_DIR);
    const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
    for (const entry of entries) {
      const entryPath = path.join(CACHE_DIR, entry);
      const info = await stat(entryPath);
      if (info.mtimeMs < cutoff) await unlink(entryPath);
    }
  } catch {}
}

async function pruneBySize(maxBytes: number) {
  const entries = await readdir(CACHE_DIR).catch(() => []);
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(CACHE_DIR, entry);
      const info = await stat(entryPath);
      return { path: entryPath, size: info.size, mtime: info.mtimeMs };
    }),
  );
  let total = files.reduce((sum, file) => sum + file.size, 0);
  for (const file of files.sort((a, b) => a.mtime - b.mtime)) {
    if (total <= maxBytes) break;
    await unlink(file.path);
    total -= file.size;
  }
}

async function putR2(key: string, body: Buffer, contentType: string) {
  const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
  const bucket = process.env.CLOUDFLARE_R2_BUCKET;
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
  if (!accountId || !bucket || !accessKeyId || !secretAccessKey) return false;

  const host = `${accountId}.r2.cloudflarestorage.com`;
  const url = new URL(`https://${host}/${bucket}/${key}`);
  const now = new Date();
  const date = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = date.slice(0, 8);
  const region = "auto";
  const service = "s3";
  const payloadHash = createHash("sha256").update(body).digest("hex");
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const canonicalHeaders = `host:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${date}\n`;
  const signedHeaders = "host;x-amz-content-sha256;x-amz-date";
  const canonicalRequest = `PUT\n/${bucket}/${key}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;
  const stringToSign = `AWS4-HMAC-SHA256\n${date}\n${credentialScope}\n${createHash("sha256").update(canonicalRequest).digest("hex")}`;
  const hmac = (secret: Buffer | string, value: string) =>
    createHmac("sha256", secret).update(value).digest();
  const signingKey = hmac(
    hmac(hmac(hmac(`AWS4${secretAccessKey}`, dateStamp), region), service),
    "aws4_request",
  );
  const signature = createHmac("sha256", signingKey).update(stringToSign).digest("hex");

  const authorization = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: authorization,
      "Content-Type": contentType,
      "x-amz-content-sha256": payloadHash,
      "x-amz-date": date,
    },
    body: body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength) as ArrayBuffer,
  });
  return res.ok;
}

export async function getCachedMedia(url: string) {
  const settings = await getAdminSettings();
  if (!settings.cache.enabled) return null;

  await mkdir(CACHE_DIR, { recursive: true });
  await pruneOldEntries(settings.cache.retentionDays);
  await pruneBySize(Math.min(settings.cache.localMaxBytes, 10 * 1024 * 1024 * 1024));

  const key = safeCacheName(url);
  const localPath = path.join(CACHE_DIR, key);
  const publicUrl =
    settings.cache.r2Enabled && settings.cache.r2PublicBaseUrl
      ? `${settings.cache.r2PublicBaseUrl.replace(/\/$/, "")}/${key}`
      : null;

  if (settings.cache.localEnabled) {
    try {
      const body = await readFile(localPath);
      return { body, contentType: contentTypeForPath(localPath), key, publicUrl };
    } catch {}
  }

  const upstream = await fetch(url, { signal: AbortSignal.timeout(20_000) });
  if (!upstream.ok) return null;
  const contentType = upstream.headers.get("content-type") || contentTypeForPath(url);
  const body = Buffer.from(await upstream.arrayBuffer());

  if (settings.cache.localEnabled) {
    await writeFile(localPath, body);
    await pruneBySize(Math.min(settings.cache.localMaxBytes, 10 * 1024 * 1024 * 1024));
  }

  if (settings.cache.r2Enabled) await putR2(key, body, contentType).catch(() => false);

  return { body, contentType, key, publicUrl };
}

function contentTypeForPath(filePath: string) {
  if (filePath.endsWith(".jpg") || filePath.endsWith(".jpeg")) return "image/jpeg";
  if (filePath.endsWith(".png")) return "image/png";
  if (filePath.endsWith(".webp")) return "image/webp";
  if (filePath.endsWith(".gif")) return "image/gif";
  if (filePath.endsWith(".mp4")) return "video/mp4";
  if (filePath.endsWith(".m3u8")) return "application/vnd.apple.mpegurl";
  if (filePath.endsWith(".ts")) return "video/mp2t";
  return "application/octet-stream";
}

export async function getCacheStats() {
  const settings = await getAdminSettings();
  return {
    usageBytes: await getCacheUsageBytes(CACHE_DIR),
    maxBytes: Math.min(settings.cache.localMaxBytes, 10 * 1024 * 1024 * 1024),
    retentionDays: settings.cache.retentionDays,
    path: CACHE_DIR,
  };
}
