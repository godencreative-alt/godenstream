# Deploy DramaShort di cPanel

DramaShort adalah aplikasi Next.js server-rendered, jadi cPanel hanya feasible jika hosting menyediakan **Setup Node.js App / Node.js Selector** dengan Node.js 22 dan memperbolehkan long-running Node.js process.

## Kapan cPanel tidak feasible

Skip cPanel dan gunakan VPS/aaPanel/Docker jika hosting Anda:

- hanya mendukung static hosting atau PHP;
- tidak menyediakan Node.js 22;
- tidak mengizinkan custom startup file;
- membatasi proses Node.js long-running;
- tidak memberi akses environment variable rahasia.

## 1. Buat Node.js app

1. Login cPanel.
2. Buka **Setup Node.js App**.
3. Klik **Create Application**.
4. Pilih Node.js 22 jika tersedia.
5. Application mode: `Production`.
6. Application root: misalnya `dramashort`.
7. Application URL: pilih domain/subdomain.
8. Application startup file: `server.js`.

## 2. Upload project

Upload source melalui Git Version Control, File Manager, atau SSH:

```bash
cd ~/dramashort
git clone https://github.com/godencreative-alt/godenstream.git .
git checkout devin/1778124302-shordrama-refactor-v2
```

Untuk production setelah PR merge, gunakan branch release/main yang berisi v1.0.0.

## 3. Environment variables

Di halaman Node.js App, tambahkan:

```text
NEXT_PUBLIC_API_BASE=/api/proxy
NEXT_PUBLIC_APP_URL=https://domain-anda.com
UPSTREAM_API_URL=https://captain.sapimu.au
API_KEY=ISI_TOKEN_API_DI_SINI
NODE_ENV=production
PORT=3000
ADMIN_USERNAME=admin
ADMIN_PASSWORD=GANTI_PASSWORD_KUAT
ADMIN_SESSION_SECRET=GANTI_RANDOM_SECRET
DRAMASHORT_DATA_DIR=/home/USERNAME/dramashort-data
DRAMASHORT_CACHE_DIR=/home/USERNAME/dramashort-cache
```

Jangan tambahkan token sebagai `NEXT_PUBLIC_*`.

Jika cPanel tidak mengizinkan write directory selain app root, fitur admin settings/cache bisa gagal. Gunakan VPS/aaPanel jika butuh cache lokal 10GB, R2 sync, dan Cloudflare automation penuh.

## 4. Build standalone

Masuk terminal cPanel/SSH:

```bash
cd ~/dramashort
npm ci
npm run build
```

Next.js menghasilkan output standalone di `.next/standalone`.

## 5. Siapkan startup cPanel

Jika cPanel menjalankan app dari root project, salin standalone output:

```bash
cp -R .next/standalone/* ./
cp -R .next/static ./.next/static
cp -R public ./public
```

Pastikan `server.js` ada di application root. Lalu di cPanel klik **Restart** pada Node.js app.

## 6. Verifikasi

Buka domain aplikasi dan cek:

- `/` homepage;
- `/trending`, `/popular`, `/terbaru`;
- `/search?q=test`;
- detail dan player shordrama.
- `/admin` login dan simpan settings.
- cache media hanya aktif jika hosting mengizinkan write ke `DRAMASHORT_CACHE_DIR`.

Jika muncul error 503, cek log Node.js App di cPanel. Error paling umum: versi Node terlalu lama, dependency belum install, atau `.env`/environment variable belum lengkap.

## Cloudflare/R2 di cPanel

Cloudflare anti-DDoS utama tetap dikonfigurasi di dashboard Cloudflare: proxy DNS orange-cloud, WAF Managed Rules, Bot Fight Mode, rate limiting `/api/*`, dan Under Attack Mode saat diperlukan. R2 bisa dipakai hanya jika hosting mengizinkan env secret dan outbound HTTPS ke R2.
