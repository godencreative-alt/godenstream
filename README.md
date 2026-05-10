# DramaShort

DramaShort adalah frontend streaming shordrama berbasis Next.js yang fokus pada katalog drama pendek dari 43 platform resmi yang tersedia di captain.sapimu.au. Aplikasi memakai proxy API server-side agar token upstream tidak perlu diekspos ke browser.

## Fitur utama

- Homepage dengan section untuk semua platform resmi captain.sapimu.au, masing-masing 5 kolom x 2 baris di desktop.
- Navbar utama: Trending, Popular, Terbaru, dan dropdown Lainnya.
- Halaman legal/info: Syarat dan Ketentuan, Kebijakan Privasi, DMCA, Tentang.
- Halaman aggregate Trending/Popular/Terbaru dengan filter semua platform.
- Halaman platform lengkap untuk seluruh provider resmi captain.sapimu.au.
- Pencarian shordrama global.
- Detail drama dengan daftar episode.
- Player episode dengan HLS, pilihan kualitas, subtitle, progress lokal, fullscreen, dropdown episode fullscreen, tombol kembali fullscreen, dan double-tap skip 10 detik.
- Security headers dasar, allowlist proxy API, timeout upstream, dan rate limit sederhana.
- Whitelabel admin dashboard untuk mengganti nama website, logo header/footer, favicon, SEO, footer, carousel trending, ads, anti-adblock, cache media, dan admin account.
- Analytics ringan untuk visitor hari ini/7 hari/bulan ini dan Top 20 drama ditonton.
- Cache gambar/video opsional ke storage lokal dengan retention dan limit maksimum 10GB, plus upload opsional ke Cloudflare R2.
- Integrasi Cloudflare anti-DDoS berbasis env untuk apply security level/browser check/hotlink protection.

## Tech stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- TanStack Query
- hls.js

## Prasyarat

- Node.js 22 LTS atau lebih baru
- npm
- Akses API upstream `https://captain.sapimu.au`
- API token dari penyedia upstream

## Instalasi lokal

```bash
npm install
cp .env.example .env
```

Isi `.env`:

```bash
NEXT_PUBLIC_API_BASE=/api/proxy
NEXT_PUBLIC_APP_URL=http://localhost:3000
UPSTREAM_API_URL=https://captain.sapimu.au
API_KEY=isi_token_api_di_sini
NODE_ENV=development
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
ADMIN_SESSION_SECRET=ganti_dengan_random_secret
```

Jalankan dev server:

```bash
npm run dev
```

Buka `http://localhost:3000`.

## Script

```bash
npm run dev      # menjalankan Next.js development server
npm run build    # build production standalone
npm run start    # menjalankan hasil build production
```

## Konfigurasi environment

| Variable | Wajib | Contoh | Keterangan |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_API_BASE` | Ya | `/api/proxy` | Base URL yang dipakai browser. Gunakan proxy internal untuk menjaga API key. |
| `NEXT_PUBLIC_APP_URL` | Ya | `https://domain.com` | URL publik aplikasi untuk sitemap/metadata. |
| `UPSTREAM_API_URL` | Ya | `https://captain.sapimu.au` | Base URL upstream API. |
| `API_KEY` | Ya | `***` | Token upstream. Simpan di server/env, jangan commit. |
| `NODE_ENV` | Ya | `production` | Mode runtime Node.js. |
| `DRAMASHORT_DATA_DIR` | Tidak | `.data` | Lokasi file settings dan analytics admin. |
| `DRAMASHORT_CACHE_DIR` | Tidak | `.cache/media` | Lokasi cache media lokal. |
| `ADMIN_USERNAME` | Tidak | `admin` | Username default saat settings belum dibuat. |
| `ADMIN_PASSWORD` | Tidak | `***` | Password default saat settings belum dibuat. |
| `ADMIN_SESSION_SECRET` | Disarankan | `***` | Secret cookie admin. |
| `CLOUDFLARE_R2_ACCOUNT_ID` | Jika R2 | `***` | Account ID R2. |
| `CLOUDFLARE_R2_BUCKET` | Jika R2 | `dramashort-cache` | Bucket R2. |
| `CLOUDFLARE_R2_ACCESS_KEY_ID` | Jika R2 | `***` | R2 access key. |
| `CLOUDFLARE_R2_SECRET_ACCESS_KEY` | Jika R2 | `***` | R2 secret key. |
| `CLOUDFLARE_ZONE_ID` | Jika apply CF | `***` | Zone ID untuk anti-DDoS apply endpoint. |
| `CLOUDFLARE_API_TOKEN` | Jika apply CF | `***` | Token Cloudflare dengan permission zone settings edit. |
| `CLOUDFLARE_DDOS_HEADERS` | Tidak | `true` | Tambah header isolation ekstra saat diaktifkan. |

Jangan gunakan `NEXT_PUBLIC_API_TOKEN` di production karena variable `NEXT_PUBLIC_*` dapat masuk bundle browser.

## Struktur penting

```text
src/app/page.tsx                         Homepage platform
src/app/trending/page.tsx                 Aggregate trending
src/app/popular/page.tsx                  Aggregate popular
src/app/terbaru/page.tsx                  Aggregate terbaru
src/app/platform/[platform]/page.tsx      Listing platform
src/app/shordrama/[platform]/[dramaId]    Detail drama
src/app/shordrama/[platform]/[dramaId]/[episode] Player episode
src/app/admin                              Admin dashboard
src/app/api/admin/*                        Admin auth/settings/Cloudflare actions
src/app/api/analytics/*                    Visitor/watch analytics
src/app/api/cache/media                    Media cache proxy
src/app/api/proxy/[...path]/route.ts      Proxy API server-side
src/components/player/VideoPlayer.tsx     Video player
src/lib/admin/*                            Settings, analytics, cache helpers
src/lib/api.ts                            Mapping API platform
```

## Admin dashboard

Buka `/admin`. Default development login adalah `admin` / `admin123` jika env `ADMIN_USERNAME` dan `ADMIN_PASSWORD` belum diatur. Setelah login pertama, ganti username/password dari dashboard.

Dashboard menyimpan settings di `DRAMASHORT_DATA_DIR/admin-settings.json` dan analytics di `DRAMASHORT_DATA_DIR/analytics.json`, sehingga website bersifat whitelabel:

- nama website, tagline, logo header/footer, favicon;
- meta title, title template, description, keywords, OpenGraph image;
- footer text;
- trending cover carousel di front page;
- script ads kompatibel dengan loader Adsterra/Adzilla;
- anti-adblock dan script anti-adblock tambahan;
- local/R2 media cache settings;
- Cloudflare anti-DDoS notes/status;
- username/password admin.

## Media cache lokal dan Cloudflare R2

Aktifkan dari `/admin` bagian **Cache video/gambar**. Cache lokal dibatasi maksimum 10GB dan dipangkas berdasarkan retention serta ukuran. Untuk R2, set env Cloudflare R2 lalu isi `R2 public base URL` di dashboard.

Endpoint cache hanya menerima URL media `https` dari host yang di-allowlist untuk menghindari SSRF. Browser akan memakai `/api/cache/media?url=...` saat cache aktif.

## Cloudflare anti-DDoS

Aplikasi tidak bisa menggantikan proteksi jaringan Cloudflare, tetapi menyediakan:

- security headers;
- optional isolation headers via `CLOUDFLARE_DDOS_HEADERS=true`;
- endpoint admin `/api/admin/cloudflare/apply` untuk mengatur `security_level`, `browser_check`, dan `hotlink_protection` bila env Cloudflare tersedia;
- catatan konfigurasi manual di dashboard.

Rekomendasi Cloudflare: aktifkan proxy orange-cloud, WAF Managed Rules, Bot Fight Mode, rate limiting untuk `/api/*`, caching untuk asset static, dan Under Attack Mode saat serangan.

## Build production

```bash
npm ci
npm run build
npm run start
```

Default production port adalah `3000`. Untuk mengubah port:

```bash
PORT=3001 npm run start
```

## Docker

```bash
cp .env.example .env
# isi API_KEY dan NEXT_PUBLIC_APP_URL di .env
docker compose up -d --build
```

Aplikasi berjalan di port `3000`.

## Deployment

- aaPanel: lihat `docs/deploy-aapanel.md`
- cPanel/Node.js Selector: lihat `docs/deploy-cpanel.md`

Jika hosting cPanel tidak menyediakan Node.js 22 atau tidak mengizinkan long-running Node.js app, deploy cPanel tidak feasible; gunakan VPS/aaPanel, Docker, atau platform Node.js seperti Vercel/Fly/Render.

## Security notes

- API key wajib berada di server (`API_KEY`), bukan hard-coded di source code.
- Browser hanya memanggil `/api/proxy`.
- Proxy memakai allowlist path dan rate limit per IP.
- Admin session memakai cookie HTTP-only dan secret dari env.
- Simpan `DRAMASHORT_DATA_DIR` dan `DRAMASHORT_CACHE_DIR` di luar public web root.
- Response upstream tidak meneruskan header sensitif seperti `server`/`x-powered-by`.
- Subtitle VTT dibersihkan dari tag HTML non-allowlist sebelum render.
- Jalankan `npm audit` secara berkala sebelum release.

## Known upstream behavior

Beberapa platform dapat mengembalikan katalog tetapi tidak selalu mengirim URL video untuk episode tertentu. Jika URL video kosong, UI menampilkan fallback `Video belum tersedia` agar user tidak melihat error mentah.
