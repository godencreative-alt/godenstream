# GodenStream Session Memory

## Active Work
- [Thumbnail + Video Bugfix (2026-06-23)](memory/thumbnail-video-bugfix-2026-06-23.md) — in-progress fix; frontend bugs from /api/v1→/v1 migration + non-obvious backend shapes. Resume checklist inside.

## Project Info
- **Frontend**: Next.js 16.2.4 at `/www/wwwroot/stream.godenpg.dev`
- **PM2**: `godenstream`, port 3001
- **Deploy**: `bash deploy.sh` (build → sync standalone → PM2 restart)
- **Git**: branch `devin/1778124302-shordrama-refactor`, repo `godencreative-alt/godenstream`
- **API Key**: `gp_Nm7uHR-lIFs744gVuyUr9ZxjYT0CYKTP42o92Gco3WQ` (in `.env`)

## Backend API
- **Base URL**: `https://api.godenpg.dev`
- **Endpoint prefix**: `/v1/` (was `/api/v1/`, migrated)
- **Categories**: anime, donghua, comic, movie, tv-series, adult (west/jav/asian/indonesia)
- **Adult content**: Uses `video.embed` field from latest response (base64-encoded asset URLs)
- **Premium proxy**: 980/1000 working, `active: false` (causes detail/sources 502 for most items)

## Key Files
- `src/lib/api.ts` — All API functions, endpoint paths, pickPlayback, pickEmbedUrl, decodeAssetBase64
- `src/lib/utils.ts` — proxyThumbnail, decodeAssetBase64 for thumbnails
- `src/app/api/proxy/[...path]/route.ts` — Proxy route, CONTENT_PREFIXES (`/v1/*`)
- `src/app/entertainment/[id]/EntertainmentDetailClient.tsx` — Entertainment detail with adult iframe embed
- `src/app/entertainment/browse/page.tsx` — Entertainment browse with adult type tabs + buildHref with embed URL
- `src/components/player/SafeEmbed.tsx` — Iframe wrapper with ad-block overlay
- `src/components/player/VideoPlayer.tsx` — HLS/MP4 video player with speed, PiP, subtitles
- `public/sw-adblock.js` — Service worker for ad domain blocking

## Architecture Notes
- Server components skip detail fetches (backend too slow), client fetches via `/api/proxy`
- Adult content: browse page passes `video.embed` decoded URL as query param → detail page renders `<SafeEmbed>` iframe directly
- `InfiniteGrid` component: `buildHref(key, item)` receives full item data for building links
- `proxyThumbnail()`: decodes `/v1/asset/{base64}` for images, routes hotlink-blocked hosts through `/api/img`
- `decodeAssetBase64(url)`: extracts base64 from asset URLs, decodes to original URL

## Content Categories
| Section | Endpoint | Subcategories | Types |
|---|---|---|---|
| Anime | `/v1/anime` | series, movie, hentai | — |
| Donghua | `/v1/donghua` | series, movie | — |
| Comic | `/v1/comic` | manga, manhwa, manhua, adult | — |
| Movie | `/v1/entertainment` | movie | — |
| TV-Series | `/v1/entertainment` | tv-series | — |
| Adult West | `/v1/entertainment` | adult | west (redtube embed) |
| Adult JAV | `/v1/entertainment` | adult | jav (xvideos embed) |
| Adult Asian | `/v1/entertainment` | adult | asian |
| Adult Indonesia | `/v1/entertainment` | adult | indonesia |

## Dead Code Removed
- Sections: drama, iqiyi, wetv, popular, trending, terbaru, platform, adult standalone
- Components: SwipeCarousel, LoginGate
- Files: device.ts, Movies.jsx, Series.jsx

## Backend Issues (Not Frontend)
- Premium proxies not activated (`active: false`)
- Detail/sources endpoints return 502 for uncached items
- Only cached items (first in each list) return working sources
- Asian slug format starts with `/` causing double-slash in URLs
