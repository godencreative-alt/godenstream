# DramaShort

DramaShort adalah platform streaming drama pendek berbasis **Next.js 16 App Router** yang mengambil katalog dari API `https://captain.sapimu.au` melalui proxy server-side. Website dibuat sebagai **whitelabel**, sehingga nama brand, logo, favicon, footer, SEO, carousel homepage, iklan, anti-adblock, cache, dan akun admin bisa diubah dari dashboard tanpa hard-code ulang source code.

## Fitur utama

- Homepage dengan cover drama trending dan infinite scrolling carousel yang bisa dikonfigurasi dari dashboard admin.
- Integrasi platform drama yang tersedia di `captain.sapimu.au`; platform yang tidak tersedia di upstream tidak perlu ditampilkan.
- Navbar `Trending`, `Popular`, `Terbaru`, pencarian, halaman platform, detail drama, daftar episode, dan player episode.
- Player video HLS/MP4 dengan pilihan kualitas, subtitle, progress lokal, fullscreen, tombol back fullscreen, dropdown episode fullscreen, dan double-tap skip 10 detik.
- Dashboard admin di `/admin` dengan login cookie HTTP-only.
- Statistik admin: visitor hari ini, 7 hari, bulan ini, dan Top 20 drama ditonton.
- Whitelabel settings: nama website, tagline, logo header/footer, favicon, SEO metadata, dan footer.
- Ads settings untuk script Adsterra/Adzilla atau script iklan lain.
- Anti-adblock bawaan dan slot script anti-adblock tambahan.
- Cache gambar/video opsional ke local storage dengan retention dan batas maksimum 10GB.
- Upload cache opsional ke Cloudflare R2.
- Cloudflare anti-DDoS helper: security headers, status setting, dan endpoint apply Cloudflare zone settings jika env Cloudflare tersedia.
- Dokumentasi deployment aaPanel dan cPanel.

## Tech stack

- Node.js 22+
- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- TanStack Query
- Zustand
- hls.js
- PM2/Nginx untuk self-hosting

## Prasyarat

1. Node.js 22 LTS atau lebih baru.
2. npm.
3. API token upstream `captain.sapimu.au`.
4. Domain dan hosting yang mendukung long-running Node.js process untuk production.

> Jangan hard-code API token di source code. Token harus disimpan sebagai environment variable `API_KEY` di server.

## Instalasi lokal

```bash
npm install
cp .env.example .env
```

Jika `.env.example` belum ada di deployment Anda, buat `.env` manual:

```bash
NEXT_PUBLIC_API_BASE=/api/proxy
NEXT_PUBLIC_APP_URL=http://localhost:3000
UPSTREAM_API_URL=https://captain.sapimu.au
API_KEY=ISI_TOKEN_API_DI_SINI
NODE_ENV=development
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
ADMIN_SESSION_SECRET=ganti_dengan_random_secret_panjang
DRAMASHORT_DATA_DIR=.data
DRAMASHORT_CACHE_DIR=.cache/media
```

Jalankan development server:

```bash
npm run dev
```

Buka:

```text
http://localhost:3000
```

## Script

```bash
npm run dev       # menjalankan Next.js development server
npm run build     # build production standalone
npm run start     # menjalankan hasil build standalone
```

Project memakai `output: "standalone"` di `next.config.ts`, jadi production server dijalankan dari `.next/standalone/server.js`, bukan `next start`.

## Environment variables

| Variable | Wajib | Contoh | Keterangan |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_API_BASE` | Ya | `/api/proxy` | Base URL API yang dipakai browser. Gunakan proxy internal agar token tidak bocor. |
| `NEXT_PUBLIC_APP_URL` | Ya | `https://domain.com` | URL publik aplikasi untuk metadata/SEO. |
| `UPSTREAM_API_URL` | Ya | `https://captain.sapimu.au` | Base URL upstream API. |
| `API_KEY` | Ya | `***` | Token upstream server-side. Jangan gunakan prefix `NEXT_PUBLIC_`. |
| `NODE_ENV` | Ya | `production` | Mode runtime. |
| `PORT` | Tidak | `3000` | Port Node.js app. |
| `HOSTNAME` | Tidak | `0.0.0.0` | Host bind production. |
| `DRAMASHORT_DATA_DIR` | Disarankan | `/www/wwwroot/dramashort-data` | Lokasi file settings dan analytics. Simpan di luar public web root. |
| `DRAMASHORT_CACHE_DIR` | Disarankan | `/www/wwwroot/dramashort-cache` | Lokasi cache media lokal. Simpan di luar public web root. |
| `ADMIN_USERNAME` | Disarankan | `admin` | Username default sebelum settings admin disimpan. |
| `ADMIN_PASSWORD` | Disarankan | `***` | Password default sebelum settings admin disimpan. |
| `ADMIN_SESSION_SECRET` | Ya untuk production | `***` | Secret signing cookie admin. Gunakan string random panjang. |
| `CLOUDFLARE_R2_ACCOUNT_ID` | Jika R2 | `***` | Account ID Cloudflare R2. |
| `CLOUDFLARE_R2_BUCKET` | Jika R2 | `dramashort-cache` | Nama bucket R2. |
| `CLOUDFLARE_R2_ACCESS_KEY_ID` | Jika R2 | `***` | Access key R2. |
| `CLOUDFLARE_R2_SECRET_ACCESS_KEY` | Jika R2 | `***` | Secret key R2. |
| `CLOUDFLARE_ZONE_ID` | Jika apply Cloudflare | `***` | Zone ID domain Cloudflare. |
| `CLOUDFLARE_API_TOKEN` | Jika apply Cloudflare | `***` | Token Cloudflare dengan permission zone settings edit. |
| `CLOUDFLARE_DDOS_HEADERS` | Tidak | `true` | Menambah isolation security headers saat diaktifkan. |

## Admin dashboard

Buka:

```text
/admin
```

Default development login:

```text
Username: admin
Password: admin123
```

Untuk production, set `ADMIN_USERNAME`, `ADMIN_PASSWORD`, dan `ADMIN_SESSION_SECRET` sebelum boot pertama, lalu ubah credential dari dashboard.

Data admin disimpan di:

```text
DRAMASHORT_DATA_DIR/admin-settings.json
DRAMASHORT_DATA_DIR/analytics.json
```

Panel admin mencakup:

- statistik visitor dan Top 20 drama ditonton;
- nama website, tagline, logo, favicon, dan footer;
- SEO title/description/keywords/OpenGraph;
- carousel trending homepage;
- script iklan;
- anti-adblock;
- cache media local/R2;
- Cloudflare anti-DDoS;
- perubahan username/password admin.

## Struktur penting

```text
src/app/page.tsx                                      Homepage
src/app/trending/page.tsx                             Aggregate trending
src/app/popular/page.tsx                              Aggregate popular
src/app/terbaru/page.tsx                              Aggregate terbaru
src/app/platform/[platform]/page.tsx                  Listing platform
src/app/search/page.tsx                               Search
src/app/shordrama/[platform]/[dramaId]/page.tsx       Detail drama
src/app/shordrama/[platform]/[dramaId]/[episode]/     Player episode
src/app/admin/                                        Admin dashboard
src/app/api/admin/*                                   Admin auth/settings/Cloudflare
src/app/api/analytics/*                               Visitor/watch analytics
src/app/api/cache/media/route.ts                      Media cache proxy
src/app/api/proxy/[...path]/route.ts                  Upstream API proxy
src/components/player/VideoPlayer.tsx                 Video player
src/components/runtime/RuntimeSettingsProvider.tsx    Public runtime whitelabel settings
src/lib/admin/*                                       Admin store/cache/session helpers
src/lib/api.ts                                        Platform API normalization
```

## Production build

```bash
npm ci
npm run build
PORT=3000 HOSTNAME=0.0.0.0 npm run start
```

Atau jalankan langsung:

```bash
PORT=3000 HOSTNAME=0.0.0.0 node .next/standalone/server.js
```

Verifikasi:

```bash
curl -I http://127.0.0.1:3000
curl -I http://127.0.0.1:3000/admin
```

## Deployment

Panduan lengkap ada di:

- [`DEPLOY.md`](./DEPLOY.md): aaPanel, cPanel, dan FAQ troubleshooting.
- [`docs/deploy-aapanel.md`](./docs/deploy-aapanel.md): catatan aaPanel ringkas.
- [`docs/deploy-cpanel.md`](./docs/deploy-cpanel.md): catatan cPanel ringkas.

Rekomendasi production paling stabil adalah VPS + aaPanel/Nginx + PM2. cPanel hanya cocok jika hosting menyediakan Node.js 22 dan long-running Node.js app.

## Docker

```bash
cp .env.example .env
# isi API_KEY dan NEXT_PUBLIC_APP_URL di .env
docker compose up -d --build
```

Aplikasi berjalan di port `3000`.

## Security notes

- Simpan `API_KEY`, admin password, session secret, dan Cloudflare secrets sebagai environment variables.
- Jangan gunakan variable `NEXT_PUBLIC_*` untuk secret karena akan masuk bundle browser.
- Browser hanya memanggil `/api/proxy`; API key disuntikkan server-side.
- Proxy memakai allowlist path, timeout upstream, header filtering, dan rate limit sederhana.
- Admin session memakai HTTP-only cookie.
- Simpan `DRAMASHORT_DATA_DIR` dan `DRAMASHORT_CACHE_DIR` di luar public web root.
- Cache endpoint hanya menerima URL media HTTPS dari host yang diizinkan untuk mengurangi risiko SSRF.
- Jalankan `npm audit --audit-level=moderate` secara berkala.
- Gunakan Cloudflare orange-cloud, WAF Managed Rules, rate limit `/api/*`, dan Under Attack Mode saat serangan.

## Known upstream behavior

Beberapa platform dapat mengembalikan katalog tetapi tidak selalu mengirim URL video untuk episode tertentu. Jika URL video kosong, UI akan menampilkan fallback `Video belum tersedia` agar user tidak melihat error mentah.
