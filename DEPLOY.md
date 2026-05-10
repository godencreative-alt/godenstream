# Deploy DramaShort

Panduan ini menjelaskan cara deploy DramaShort di **aaPanel** dan **cPanel**, termasuk konfigurasi Nginx, PM2, environment variable, SSL, dan FAQ troubleshooting saat gagal deploy.

DramaShort adalah aplikasi **Next.js server-rendered** dengan `output: "standalone"`. Artinya aplikasi harus berjalan sebagai proses Node.js, lalu domain diarahkan ke proses tersebut melalui reverse proxy. Jangan deploy seperti website PHP/static biasa.

## Ringkasan arsitektur production

```text
Browser
  ↓ HTTPS
Nginx / Apache proxy
  ↓ http://127.0.0.1:3000
Node.js Next standalone server
  ↓ server-side API key
https://captain.sapimu.au
```

## Requirement production

- Node.js 22 LTS atau lebih baru.
- npm.
- Git atau akses upload source code.
- Domain/subdomain.
- SSL aktif.
- Hosting harus mengizinkan long-running Node.js process.
- API token `captain.sapimu.au` disimpan sebagai `API_KEY` server-side.

## Environment variable production

Minimal:

```bash
NEXT_PUBLIC_API_BASE=/api/proxy
NEXT_PUBLIC_APP_URL=https://domain-anda.com
UPSTREAM_API_URL=https://captain.sapimu.au
API_KEY=ISI_TOKEN_API_DI_SINI
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0
ADMIN_USERNAME=admin
ADMIN_PASSWORD=GANTI_PASSWORD_KUAT
ADMIN_SESSION_SECRET=GANTI_RANDOM_SECRET_PANJANG
DRAMASHORT_DATA_DIR=/www/wwwroot/dramashort-data
DRAMASHORT_CACHE_DIR=/www/wwwroot/dramashort-cache
```

Opsional Cloudflare R2 / anti-DDoS helper:

```bash
CLOUDFLARE_R2_ACCOUNT_ID=...
CLOUDFLARE_R2_BUCKET=dramashort-cache
CLOUDFLARE_R2_ACCESS_KEY_ID=...
CLOUDFLARE_R2_SECRET_ACCESS_KEY=...
CLOUDFLARE_ZONE_ID=...
CLOUDFLARE_API_TOKEN=...
CLOUDFLARE_DDOS_HEADERS=true
```

Catatan keamanan:

- Jangan commit `.env`.
- Jangan pakai `NEXT_PUBLIC_API_KEY` atau `NEXT_PUBLIC_API_TOKEN`.
- `DRAMASHORT_DATA_DIR` dan `DRAMASHORT_CACHE_DIR` sebaiknya di luar public web root.
- Local cache bisa sampai 10GB, jadi pastikan disk cukup.

---

# Deploy di aaPanel

Rekomendasi paling stabil: **aaPanel + Nginx + PM2 + Node.js 22**.

## 1. Arahkan domain ke VPS

1. Buat DNS `A record` domain ke IP VPS.
2. Contoh:
   ```text
   mamahnia.me     A     123.123.123.123
   www             A     123.123.123.123
   ```
3. Tunggu DNS resolve:
   ```bash
   ping domain-anda.com
   ```

## 2. Install runtime di aaPanel

Di aaPanel **App Store**, install:

- Nginx
- Git
- PM2 Manager atau Node.js Manager

Jika Node.js 22 belum ada, install via SSH:

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs git
node -v
npm -v
```

Pastikan `node -v` minimal `v22.x` atau setidaknya memenuhi requirement Next.js di repo.

## 3. Buat website di aaPanel

1. Buka **Website** → **Add site**.
2. Domain: `domain-anda.com` dan `www.domain-anda.com`.
3. Pilih PHP static/HTML saja untuk membuat vhost awal.
4. Setelah DNS resolve, buka tab **SSL** → aktifkan Let's Encrypt.

Walaupun dibuat sebagai static/PHP di aaPanel, nantinya request akan diproxy ke Node.js.

## 4. Clone project

Contoh path production:

```bash
mkdir -p /www/wwwroot/dramashort
cd /www/wwwroot/dramashort
git clone https://github.com/godencreative-alt/godenstream.git .
```

Checkout branch production yang sudah berisi perubahan terbaru. Jika masih memakai PR branch:

```bash
git fetch origin
git checkout devin/1778412912-admin-whitelabel-dashboard
```

Jika PR sudah merge ke branch utama, gunakan branch utama/release sesuai repo Anda:

```bash
git checkout devin/base-initial-godenstream
git pull --ff-only origin devin/base-initial-godenstream
```

## 5. Buat `.env`

```bash
cd /www/wwwroot/dramashort
cat > .env <<'ENV'
NEXT_PUBLIC_API_BASE=/api/proxy
NEXT_PUBLIC_APP_URL=https://domain-anda.com
UPSTREAM_API_URL=https://captain.sapimu.au
API_KEY=ISI_TOKEN_API_DI_SINI
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0
ADMIN_USERNAME=admin
ADMIN_PASSWORD=GANTI_PASSWORD_KUAT
ADMIN_SESSION_SECRET=GANTI_RANDOM_SECRET_PANJANG
DRAMASHORT_DATA_DIR=/www/wwwroot/dramashort-data
DRAMASHORT_CACHE_DIR=/www/wwwroot/dramashort-cache
ENV
chmod 600 .env
```

Buat folder data/cache:

```bash
mkdir -p /www/wwwroot/dramashort-data /www/wwwroot/dramashort-cache
chmod 700 /www/wwwroot/dramashort-data /www/wwwroot/dramashort-cache
```

Jika proses Node berjalan sebagai user tertentu, pastikan user itu bisa menulis ke folder tersebut.

## 6. Install dependency dan build

```bash
cd /www/wwwroot/dramashort
npm ci
npm run build
```

Output production berada di:

```text
.next/standalone/server.js
.next/static
public
```

## 7. Jalankan dengan PM2

Install PM2 jika belum ada:

```bash
npm install -g pm2
```

Hapus proses lama jika ada:

```bash
pm2 delete dramashort || true
```

Jalankan standalone server:

```bash
cd /www/wwwroot/dramashort
PORT=3000 HOSTNAME=0.0.0.0 pm2 start .next/standalone/server.js --name dramashort
pm2 save
```

Agar PM2 auto-start saat reboot:

```bash
pm2 startup
```

Ikuti command yang PM2 tampilkan, biasanya perlu copy-paste satu command `sudo env PATH=... pm2 startup ...`.

Verifikasi lokal:

```bash
pm2 status
pm2 logs dramashort --lines 50
curl -I http://127.0.0.1:3000
```

Jika port 3000 sudah dipakai, gunakan 3001:

```bash
pm2 delete dramashort || true
PORT=3001 HOSTNAME=0.0.0.0 pm2 start .next/standalone/server.js --name dramashort
pm2 save
curl -I http://127.0.0.1:3001
```

Nanti `proxy_pass` Nginx juga harus diganti ke `3001`.

## 8. Konfigurasi Nginx aaPanel

Buka aaPanel:

```text
Website → pilih domain → Config
```

Gunakan pola **dua server block**: satu untuk redirect HTTP, satu untuk HTTPS.

Ganti `domain-anda.com` dengan domain Anda dan sesuaikan path SSL dari aaPanel.

```nginx
server {
    listen 80;
    server_name domain-anda.com www.domain-anda.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name domain-anda.com www.domain-anda.com;

    ssl_certificate /www/server/panel/vhost/cert/domain-anda.com/fullchain.pem;
    ssl_certificate_key /www/server/panel/vhost/cert/domain-anda.com/privkey.pem;

    client_max_body_size 20m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;

        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_cache_bypass $http_upgrade;

        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }

    location ~ ^/(\.user.ini|\.htaccess|\.git|\.env|\.svn|\.project|LICENSE|README.md|DEPLOY.md) {
        return 404;
    }

    location ~ \.well-known {
        allow all;
    }

    access_log /www/wwwlogs/domain-anda.com.log;
    error_log /www/wwwlogs/domain-anda.com.error.log;
}
```

Jika app berjalan di port 3001, ubah:

```nginx
proxy_pass http://127.0.0.1:3001;
```

Jangan jalankan `proxy_pass` di terminal. `proxy_pass` hanya valid di config Nginx.

## 9. Test dan reload Nginx

```bash
nginx -t
systemctl reload nginx
curl -I https://domain-anda.com
curl -I https://domain-anda.com/trending
curl -I https://domain-anda.com/admin
```

Checklist browser:

- `/` menampilkan layout dan CSS normal.
- `/trending`, `/popular`, `/terbaru` terbuka.
- Card drama membuka detail.
- Episode bisa play jika upstream menyediakan video.
- `/admin` bisa login.
- Save settings mengubah brand homepage/header/footer.

## 10. Update release berikutnya di aaPanel

```bash
cd /www/wwwroot/dramashort
git fetch origin
git pull --ff-only
npm ci
npm run build
pm2 restart dramashort --update-env
pm2 logs dramashort --lines 50
curl -I http://127.0.0.1:3000
curl -I https://domain-anda.com
```

Jika Anda mengganti `.env`, gunakan `--update-env` saat restart.

---

# Deploy di cPanel

cPanel hanya bisa dipakai jika hosting menyediakan **Setup Node.js App / Node.js Selector** dengan Node.js 22 dan mengizinkan long-running Node.js process. Jika hosting hanya PHP/static, cPanel tidak cocok untuk DramaShort.

## Kapan harus skip cPanel

Gunakan VPS/aaPanel/Docker jika cPanel Anda:

- tidak punya menu **Setup Node.js App**;
- Node.js maksimal di bawah versi 20/22;
- tidak mengizinkan custom startup file;
- tidak mengizinkan process Node.js berjalan terus;
- tidak memberi akses SSH/terminal;
- tidak memberi environment variable rahasia;
- storage kecil sehingga cache lokal 10GB tidak mungkin;
- outbound HTTPS ke `captain.sapimu.au` atau Cloudflare R2 diblokir.

## 1. Buat Node.js app di cPanel

1. Login cPanel.
2. Buka **Setup Node.js App**.
3. Klik **Create Application**.
4. Pilih Node.js 22 jika tersedia.
5. Application mode: `Production`.
6. Application root: `dramashort`.
7. Application URL: pilih domain/subdomain.
8. Application startup file: `server.js`.
9. Simpan.

## 2. Upload atau clone project

Via SSH:

```bash
cd ~
mkdir -p dramashort
cd dramashort
git clone https://github.com/godencreative-alt/godenstream.git .
git fetch origin
git checkout devin/1778412912-admin-whitelabel-dashboard
```

Jika PR sudah merge, checkout branch production utama sesuai repo.

## 3. Tambahkan environment variables

Di halaman **Setup Node.js App**, tambahkan:

```text
NEXT_PUBLIC_API_BASE=/api/proxy
NEXT_PUBLIC_APP_URL=https://domain-anda.com
UPSTREAM_API_URL=https://captain.sapimu.au
API_KEY=ISI_TOKEN_API_DI_SINI
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0
ADMIN_USERNAME=admin
ADMIN_PASSWORD=GANTI_PASSWORD_KUAT
ADMIN_SESSION_SECRET=GANTI_RANDOM_SECRET_PANJANG
DRAMASHORT_DATA_DIR=/home/USERNAME/dramashort-data
DRAMASHORT_CACHE_DIR=/home/USERNAME/dramashort-cache
```

Buat folder data/cache:

```bash
mkdir -p ~/dramashort-data ~/dramashort-cache
chmod 700 ~/dramashort-data ~/dramashort-cache
```

## 4. Build standalone di cPanel

Masuk terminal/SSH cPanel:

```bash
cd ~/dramashort
npm ci
npm run build
```

## 5. Siapkan startup file cPanel

Banyak cPanel menjalankan startup file dari application root. Karena Next standalone menghasilkan `server.js` di `.next/standalone`, salin output runtime ke root aplikasi:

```bash
cd ~/dramashort
cp -R .next/standalone/* ./
mkdir -p .next
cp -R .next/static ./.next/static
cp -R public ./public
```

Pastikan ada:

```bash
ls -la server.js .next/static public
```

Lalu di cPanel klik **Restart** pada Node.js app.

## 6. Verifikasi cPanel

Buka domain dan cek:

- `/`
- `/trending`
- `/popular`
- `/terbaru`
- `/search?q=test`
- `/admin`

Jika error 503, cek log Node.js App di cPanel.

## 7. Update release berikutnya di cPanel

```bash
cd ~/dramashort
git pull --ff-only
npm ci
npm run build
cp -R .next/standalone/* ./
mkdir -p .next
cp -R .next/static ./.next/static
cp -R public ./public
```

Lalu klik **Restart** di Node.js App.

---

# Cloudflare setup yang disarankan

1. DNS domain di Cloudflare harus **Proxied** / orange cloud.
2. SSL/TLS mode: `Full` atau `Full (strict)` jika certificate origin valid.
3. Aktifkan **WAF Managed Rules**.
4. Aktifkan **Bot Fight Mode** jika tersedia.
5. Buat rate limit untuk:
   - `/api/proxy/*`
   - `/api/cache/*`
   - `/api/analytics/*`
   - `/admin/*`
6. Aktifkan **Hotlink Protection** jika cocok dengan kebutuhan media.
7. Saat serangan, aktifkan **Under Attack Mode**.
8. Jika memakai R2, buat bucket private/public sesuai strategi cache dan isi env R2 di server.

---

# FAQ dan troubleshooting

## 1. `Error: listen EADDRINUSE: address already in use :::3000`

Port 3000 sudah dipakai proses lain.

Cek proses:

```bash
lsof -i :3000
pm2 list
```

Solusi A, hentikan proses lama:

```bash
pm2 delete dramashort || true
```

Solusi B, pakai port lain:

```bash
PORT=3001 HOSTNAME=0.0.0.0 pm2 start .next/standalone/server.js --name dramashort
```

Lalu ubah Nginx:

```nginx
proxy_pass http://127.0.0.1:3001;
```

## 2. `next start does not work with output: standalone`

Project ini memakai `output: "standalone"`, jadi jangan jalankan `next start` langsung.

Gunakan:

```bash
node .next/standalone/server.js
```

Atau via npm:

```bash
npm run start
```

Karena script `start` sudah diarahkan ke `node .next/standalone/server.js`.

## 3. `proxy_pass: command not found`

`proxy_pass` bukan command terminal. Itu directive Nginx dan harus ditulis di file config Nginx aaPanel:

```nginx
location / {
    proxy_pass http://127.0.0.1:3000;
}
```

Setelah simpan config:

```bash
nginx -t
systemctl reload nginx
```

## 4. Website tampil polos tanpa CSS

Biasanya static asset Next.js tidak terlayani atau app tidak berjalan dari output yang benar.

Cek asset:

```bash
curl -I https://domain-anda.com/_next/static/chunks/webpack.js
find .next/static -type f | head
find .next/standalone -maxdepth 3 -type f | head
```

Untuk aaPanel, jalankan server dari project root:

```bash
cd /www/wwwroot/dramashort
PORT=3000 HOSTNAME=0.0.0.0 pm2 start .next/standalone/server.js --name dramashort
```

Untuk cPanel, salin asset:

```bash
cp -R .next/standalone/* ./
mkdir -p .next
cp -R .next/static ./.next/static
cp -R public ./public
```

Pastikan Nginx tidak punya rule static/cache yang mengambil alih `/_next/static/*`. Cara paling aman adalah proxy semua request ke Next.js melalui `location /`.

## 5. 502 Bad Gateway di aaPanel

Nginx tidak bisa konek ke Node.js.

Cek:

```bash
pm2 status
pm2 logs dramashort --lines 100
curl -I http://127.0.0.1:3000
```

Jika lokal gagal, masalah ada di Node.js/app/env. Jika lokal berhasil, masalah ada di Nginx `proxy_pass` atau port.

## 6. 404 dari Nginx, bukan dari Next.js

Biasanya config masih mengarah ke folder static/PHP, bukan proxy.

Solusi:

- Pastikan `location / { proxy_pass ... }` ada di server block domain yang benar.
- Pisahkan server block HTTP dan HTTPS.
- Hapus/comment rewrite static yang menangkap semua route Next.js.
- Reload Nginx setelah config berubah.

## 7. SSL redirect loop

Penyebab umum:

- Cloudflare SSL mode `Flexible` sementara origin juga redirect HTTPS.
- Header `X-Forwarded-Proto` tidak dikirim.

Solusi:

- Di Cloudflare gunakan `Full` atau `Full (strict)`.
- Pastikan Nginx berisi:

```nginx
proxy_set_header X-Forwarded-Proto $scheme;
proxy_set_header Host $host;
```

## 8. Admin login gagal terus

Cek env:

```bash
printenv | grep ADMIN
pm2 restart dramashort --update-env
```

Jika sudah pernah menyimpan settings admin, credential bisa berasal dari `DRAMASHORT_DATA_DIR/admin-settings.json`. Jika lupa password dan punya akses server, backup lalu hapus file settings untuk kembali ke env default:

```bash
cp /www/wwwroot/dramashort-data/admin-settings.json /www/wwwroot/dramashort-data/admin-settings.backup.json
rm /www/wwwroot/dramashort-data/admin-settings.json
pm2 restart dramashort --update-env
```

Setelah login ulang, segera ganti password dari dashboard.

## 9. Settings admin tidak tersimpan

Penyebab umum: Node.js tidak punya permission write ke `DRAMASHORT_DATA_DIR`.

Cek:

```bash
ls -ld /www/wwwroot/dramashort-data
pm2 logs dramashort --lines 100
```

Solusi:

```bash
mkdir -p /www/wwwroot/dramashort-data
chmod 700 /www/wwwroot/dramashort-data
# jika tahu user proses Node, ubah owner sesuai user tersebut
chown -R www:www /www/wwwroot/dramashort-data 2>/dev/null || true
pm2 restart dramashort --update-env
```

## 10. Video tidak bisa diputar

Cek kemungkinan:

- Upstream tidak mengirim URL video untuk episode/provider tersebut.
- API token salah atau expired.
- Browser memblokir mixed content.
- Provider sedang error.

Cek server:

```bash
pm2 logs dramashort --lines 100
curl -I https://domain-anda.com/api/proxy/netshort/home
```

Solusi:

- Pastikan `.env` berisi `API_KEY` benar.
- Pastikan `UPSTREAM_API_URL=https://captain.sapimu.au`.
- Test provider lain seperti NetShort/CashDrama jika provider tertentu kosong.
- Jika UI menampilkan `Video belum tersedia`, berarti aplikasi berjalan tetapi upstream tidak memberi URL video untuk item itu.

## 11. API error 401/403/Auth failed

Penyebab: token upstream salah, kosong, expired, atau env tidak terbaca proses Node.js.

Cek:

```bash
pm2 restart dramashort --update-env
pm2 logs dramashort --lines 100
```

Jangan print token di terminal publik. Pastikan `.env` ada dan PM2 direstart dengan `--update-env`.

## 12. `/api/proxy/...` 404 atau 500

Cek:

```bash
curl -I http://127.0.0.1:3000/api/proxy/netshort/home
curl -I https://domain-anda.com/api/proxy/netshort/home
```

Jika local OK tapi domain gagal, Nginx belum proxy semua route. Jika local gagal, cek env dan log app.

## 13. Cache lokal tidak jalan atau disk cepat penuh

Cek folder cache:

```bash
du -sh /www/wwwroot/dramashort-cache
ls -ld /www/wwwroot/dramashort-cache
```

Solusi:

- Pastikan dashboard cache aktif.
- Pastikan `DRAMASHORT_CACHE_DIR` writable.
- Turunkan retention hari.
- Pastikan limit lokal tidak lebih dari 10GB.
- Jangan taruh cache di folder public domain.

## 14. Cloudflare R2 upload gagal

Cek env R2:

```bash
pm2 restart dramashort --update-env
pm2 logs dramashort --lines 100
```

Pastikan:

- `CLOUDFLARE_R2_ACCOUNT_ID` benar.
- Bucket ada.
- Access key punya permission R2 object read/write.
- Server bisa outbound HTTPS.
- Public base URL di dashboard sesuai bucket/domain R2.

## 15. Cloudflare anti-DDoS apply gagal

Cek:

- `CLOUDFLARE_ZONE_ID` benar.
- `CLOUDFLARE_API_TOKEN` punya permission edit zone settings.
- Domain benar-benar berada di akun Cloudflare tersebut.

Fallback manual: aktifkan WAF, Bot Fight Mode, rate limit, dan Under Attack Mode dari dashboard Cloudflare.

## 16. `Failed to find Server Action ... older or newer deployment`

Biasanya browser masih membuka halaman dari build lama, lalu server sudah diganti build baru.

Solusi:

- Hard refresh browser.
- Clear cache browser/CDN.
- Restart PM2 setelah build selesai.
- Jangan deploy sebagian file; pastikan build dan restart dilakukan lengkap.

```bash
npm run build
pm2 restart dramashort --update-env
```

## 17. cPanel 503 Service Unavailable

Cek log Node.js App di cPanel.

Penyebab umum:

- Node version terlalu lama.
- `server.js` tidak ada di application root.
- `.next/static` atau `public` belum disalin.
- Env `API_KEY`/`NEXT_PUBLIC_APP_URL` belum diisi.
- Hosting tidak mengizinkan long-running process.

Solusi:

```bash
cd ~/dramashort
npm ci
npm run build
cp -R .next/standalone/* ./
mkdir -p .next
cp -R .next/static ./.next/static
cp -R public ./public
```

Restart Node.js App dari cPanel.

## 18. Build gagal karena memory kecil

Next.js build bisa butuh memory besar.

Solusi:

- Tambah swap di VPS.
- Build di server dengan RAM lebih besar lalu deploy artifact.
- Kurangi proses lain saat build.

Contoh tambah swap 2GB di VPS:

```bash
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
```

Tambahkan ke `/etc/fstab` jika ingin permanen.

## 19. Domain masih membuka halaman default aaPanel

Nginx config domain belum mengarah ke proxy Node.js.

Solusi:

- Pastikan edit config domain yang benar.
- Pastikan `server_name` benar, misalnya `mamahnia.me www.mamahnia.me`, bukan `mamahnia.me.com`.
- Jalankan:

```bash
nginx -t
systemctl reload nginx
```

## 20. Checklist final setelah deploy

```bash
curl -I https://domain-anda.com
curl -I https://domain-anda.com/trending
curl -I https://domain-anda.com/admin
pm2 status
pm2 logs dramashort --lines 30
```

Di browser:

- Homepage CSS normal.
- Carousel drama tampil.
- Search berfungsi.
- Detail dan player terbuka.
- `/admin` login berhasil.
- Save settings mengubah branding public.
- Top 20 watch analytics bertambah setelah video diputar.
