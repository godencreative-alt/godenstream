# DramaShort

DramaShort adalah frontend streaming shordrama berbasis Next.js yang fokus pada katalog drama pendek dari 5 platform: Drama-ID, DramaBox, Melolo, NetShort, dan DramaNova. Aplikasi memakai proxy API server-side agar token upstream tidak perlu diekspos ke browser.

## Fitur utama

- Homepage dengan 5 section platform, masing-masing 5 kolom x 2 baris di desktop.
- Navbar utama: Trending, Popular, Terbaru, dan dropdown Lainnya.
- Halaman legal/info: Syarat dan Ketentuan, Kebijakan Privasi, DMCA, Tentang.
- Halaman aggregate Trending/Popular/Terbaru dengan filter semua platform.
- Halaman platform lengkap untuk Drama-ID, DramaBox, Melolo, NetShort, dan DramaNova.
- Pencarian shordrama global.
- Detail drama dengan daftar episode.
- Player episode dengan HLS, pilihan kualitas, subtitle, progress lokal, fullscreen, dropdown episode fullscreen, tombol kembali fullscreen, dan double-tap skip 10 detik.
- Security headers dasar, allowlist proxy API, timeout upstream, dan rate limit sederhana.

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
src/app/api/proxy/[...path]/route.ts      Proxy API server-side
src/components/player/VideoPlayer.tsx     Video player
src/lib/api.ts                            Mapping API platform
```

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
- Response upstream tidak meneruskan header sensitif seperti `server`/`x-powered-by`.
- Subtitle VTT dibersihkan dari tag HTML non-allowlist sebelum render.
- Jalankan `npm audit` secara berkala sebelum release.

## Known upstream behavior

Beberapa platform dapat mengembalikan katalog tetapi tidak selalu mengirim URL video untuk episode tertentu. Jika URL video kosong, UI menampilkan fallback `Video belum tersedia` agar user tidak melihat error mentah.
