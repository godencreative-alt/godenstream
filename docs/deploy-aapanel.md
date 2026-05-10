# Deploy DramaShort di aaPanel

Panduan ini memakai VPS Linux dengan aaPanel, Nginx, Node.js 22, dan PM2.

## 1. Persiapan domain

1. Arahkan DNS domain/subdomain ke IP VPS.
2. Di aaPanel buka **Website** → **Add site**.
3. Isi domain, pilih PHP static/HTML saja untuk membuat vhost awal.
4. Aktifkan SSL di tab **SSL** setelah domain resolve.

## 2. Install runtime

Di aaPanel **App Store**, install:

- Nginx
- PM2 Manager atau Node.js Manager
- Git

Jika Node.js Manager belum menyediakan Node 22, install via shell:

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs git
node -v
npm -v
```

## 3. Upload/clone project

Contoh path:

```bash
mkdir -p /www/wwwroot/dramashort
cd /www/wwwroot/dramashort
git clone https://github.com/godencreative-alt/godenstream.git .
git checkout devin/1778412912-admin-whitelabel-dashboard
```

Untuk production setelah PR merge, gunakan branch release/main yang berisi v1.0.0.

## 4. Environment

Buat file `.env`:

```bash
cat > .env <<'ENV'
NEXT_PUBLIC_API_BASE=/api/proxy
NEXT_PUBLIC_APP_URL=https://domain-anda.com
UPSTREAM_API_URL=https://captain.sapimu.au
API_KEY=ISI_TOKEN_API_DI_SINI
NODE_ENV=production
ADMIN_USERNAME=admin
ADMIN_PASSWORD=GANTI_PASSWORD_KUAT
ADMIN_SESSION_SECRET=GANTI_RANDOM_SECRET_PANJANG
DRAMASHORT_DATA_DIR=/www/wwwroot/dramashort-data
DRAMASHORT_CACHE_DIR=/www/wwwroot/dramashort-cache
ENV
chmod 600 .env
```

Jangan simpan API key di repository.

Jika memakai Cloudflare R2/cache:

```bash
CLOUDFLARE_R2_ACCOUNT_ID=...
CLOUDFLARE_R2_BUCKET=dramashort-cache
CLOUDFLARE_R2_ACCESS_KEY_ID=...
CLOUDFLARE_R2_SECRET_ACCESS_KEY=...
CLOUDFLARE_ZONE_ID=...
CLOUDFLARE_API_TOKEN=...
CLOUDFLARE_DDOS_HEADERS=true
```

Buat data/cache directory di luar public vhost:

```bash
mkdir -p /www/wwwroot/dramashort-data /www/wwwroot/dramashort-cache
chmod 700 /www/wwwroot/dramashort-data /www/wwwroot/dramashort-cache
```

## 5. Install dan build

```bash
npm ci
npm run build
```

## 6. Jalankan dengan PM2

```bash
npm install -g pm2
PORT=3000 HOSTNAME=0.0.0.0 pm2 start .next/standalone/server.js --name dramashort
pm2 save
pm2 startup
```

Jika ingin memakai port selain 3000:

```bash
PORT=3001 PORT=3000 HOSTNAME=0.0.0.0 pm2 start .next/standalone/server.js --name dramashort
```

Project ini memakai `output: "standalone"`, jadi jalankan `.next/standalone/server.js`, bukan `next start`.

## 7. Reverse proxy Nginx di aaPanel

Buka site domain di aaPanel → **Config**. Tambahkan/ubah blok proxy:

```nginx
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
}
```

Reload Nginx dari aaPanel atau shell:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

## 8. Verifikasi

```bash
curl -I https://domain-anda.com
curl -I https://domain-anda.com/trending
pm2 logs dramashort
```

Checklist UI:

- Homepage menampilkan platform resmi captain.sapimu.au.
- Search berjalan.
- Detail drama terbuka dari card.
- Player episode memutar video bila upstream mengirim URL.
- Fullscreen memiliki tombol kembali dan dropdown episode.
- `/admin` bisa login dan settings tersimpan.
- Jika cache aktif, cache usage terlihat di `/admin`.

## 9. Cloudflare anti-DDoS

Di Cloudflare dashboard:

1. Pastikan DNS record domain aktif **Proxied** (orange cloud).
2. Aktifkan **WAF Managed Rules**.
3. Aktifkan **Bot Fight Mode** bila tersedia.
4. Tambahkan rate limit untuk `/api/*`, terutama `/api/proxy/*`.
5. Aktifkan **Hotlink Protection** untuk mengurangi pencurian asset.
6. Saat serangan, aktifkan **Under Attack Mode**.

Jika `CLOUDFLARE_ZONE_ID` dan `CLOUDFLARE_API_TOKEN` sudah diset, admin yang login bisa POST ke:

```bash
curl -X POST https://domain-anda.com/api/admin/cloudflare/apply
```

Lebih mudah: gunakan tombol/API client internal setelah login admin jika ditambahkan di panel.

## 10. Update release berikutnya

```bash
cd /www/wwwroot/dramashort
git pull
npm ci
npm run build
pm2 restart dramashort --update-env
```
