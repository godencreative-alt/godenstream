---
name: thumbnail-video-bugfix-2026-06-23
description: In-progress fix for broken thumbnails + unplayable video — root causes are frontend bugs left by the /api/v1→/v1 migration, plus non-obvious backend response shapes
metadata:
  type: project
---

Fixing "banyak thumbnail rusak, video tidak bisa di play" on 2026-06-23. Root causes are FRONTEND, not backend (verified against live api.godenpg.dev).

**Why:** Migration commit ee35676 (/api/v1/ → /v1/) updated most paths but missed `decodeAssetBase64` regex, breaking every asset decode. Cascading failures in video + embed paths.

**How to apply:** Resume the fix checklist below. Verify each against live API before editing — don't trust assumptions.

## Non-obvious backend shapes (verified live, treat as ground truth)
- `thumbnail` / detail `image` fields = `/v1/asset/<base64>`, base64 decodes to raw upstream URL.
- Adult list item carries `video: { embed, src }` where **embed is a RAW url** (`https://www.pornhub.com/embed/<id>`), NOT an asset-wrapped base64.
- Adult `/sources` returns `data: { embed, src }` — a bare OBJECT, not array, not `data.sources`.
- Adult DETAIL returns key `image` (not `thumbnail`), plus `models`, `tags`, `duration`, `views`.
- Anime episode `/sources`: `data.sources` array, `url` is RAW (e.g. storage.animekita.org/...mp4), types include mp4 + pixeldrain (pixeldrain silently dropped by pickPlayback).
- Movie `/sources` currently 502/504 — genuine backend outage, NOT a frontend path bug.

## Fix checklist
- [x] api.ts:79 `decodeAssetBase64` regex `/api/v1/asset/` → `/v1/asset/` (DONE)
- [x] browse/page.tsx buildHref: use raw `video.embed` directly, fall back to decode (DONE)
- [ ] api.ts fetchEntertainmentSources (~line 632): handle adult `data:{embed,src}` object → synth an embed source so detail player works. Currently returns empty sources → "Video not available".
- [ ] utils.ts HOTLINK_BLOCKED_HOSTS: add hosts that 403/timeout on direct fetch — otakudesu.blog (403), rebahin.is, lk21.media (conn timeout), terbit21.com, drakorid.cc/.click. These are in img/route.ts ALLOWED_HOSTS but missing from blocked list → returned as direct URL → Next optimizer fails → broken thumb. (cdn.myanimelist, animekita, phncdn, movieloop.ink, anichin.co, komikindo.ch all return 200 direct — fine.)
- [ ] next.config.ts:49 X-Frame-Options source `/api/proxy/api/v1/asset/:path*` → `/api/proxy/v1/asset/:path*` (post-migration path; same-origin SafeEmbed iframes inherit DENY otherwise).
- [ ] Consider: EntertainmentDetail type lacks `video` field + detail uses `thumbnail` but adult detail sends `image`.

## After fixes
- Build: `npm run build` then `bash deploy.sh` (build → sync standalone → PM2 restart `godenstream` port 3001).
- No Chrome on box — can't use chrome-devtools MCP. Verify via curl + reading code.
- Open agents (resumable via SendMessage): a0c22ca6475e871cb (API audit), a920a0820d9eb3913 (thumbnail), ab84a4fa860917a10 (video).
