# Deploy DramaShort di aaPanel

Panduan ini memakai VPS Linux dengan aaPanel, Nginx, Node.js 22, dan PM2.
Project ini memakai `output: "standalone"` di `next.config.ts`, jadi production **tidak boleh** dijalankan dengan `next start` / `npm start`. Jalankan hasil build dengan `node .next/standalone/server.js`.

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
git checkout devin/base-initial-godenstream
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
PORT=3000
HOSTNAME=0.0.0.0
ENV
chmod 600 .env
```

Jangan simpan API key di repository.

## 5. Install dan build

```bash
npm ci
npm run build
```

## 6. Jalankan standalone Next.js dengan PM2

Karena project memakai standalone output, gunakan `server.js` hasil build:

```bash
cd /www/wwwroot/dramashort
npm install -g pm2
pm2 delete dramashort || true
PORT=3000 HOSTNAME=0.0.0.0 pm2 start .next/standalone/server.js --name dramashort
pm2 save
```

Jangan gunakan `npm start`, `next start`, atau `pm2 start npm --name dramashort -- start` karena Next.js akan menolak `next start` saat `output: "standalone"` aktif.

Jika muncul `EADDRINUSE: address already in use :::3000`, port 3000 sedang dipakai. Cek prosesnya:

```bash
pm2 list
ss -ltnp | grep ':3000'
```

Hentikan proses lama atau pindah ke port 3001:

```bash
pm2 delete dramashort || true
PORT=3001 HOSTNAME=0.0.0.0 pm2 start .next/standalone/server.js --name dramashort
pm2 save
```

Jika memakai port 3001, `proxy_pass` Nginx juga harus diarahkan ke `http://127.0.0.1:3001`.

Verifikasi app lokal sebelum mengubah Nginx:

```bash
curl -I http://127.0.0.1:3000
pm2 logs dramashort --lines 50
```

## 7. Reverse proxy Nginx di aaPanel

`proxy_pass` bukan command terminal. Tulis `proxy_pass` hanya di config Nginx: **Website** → pilih domain → **Config**.

Gunakan dua blok `server` terpisah: satu untuk HTTP redirect dan satu untuk HTTPS app. Contoh untuk domain sementara `mamahnia.me`:

```nginx
server {
    listen 80;
    server_name mamahnia.me www.mamahnia.me;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name mamahnia.me www.mamahnia.me;

    ssl_certificate /www/server/panel/vhost/cert/mamahnia.me/fullchain.pem;
    ssl_certificate_key /www/server/panel/vhost/cert/mamahnia.me/privkey.pem;

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

    location ~ ^/(\.user.ini|\.htaccess|\.git|\.env|\.svn|\.project|LICENSE|README.md) {
        return 404;
    }

    location ~ \.well-known {
        allow all;
    }

    access_log /www/wwwlogs/mamahnia.me.log;
    error_log /www/wwwlogs/mamahnia.me.error.log;
}
```

Jika PM2 memakai port 3001, ubah hanya baris ini:

```nginx
proxy_pass http://127.0.0.1:3001;
```

Jangan pakai `server_name mamahnia.me.com www.mamahnia.me.com;` untuk domain `mamahnia.me`.

Reload Nginx dari aaPanel atau shell:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

## 8. Verifikasi

```bash
curl -I https://domain-anda.com
curl -I https://domain-anda.com/trending
curl -I https://domain-anda.com/api/proxy/netshort/home
pm2 logs dramashort
```

Checklist UI:

- Homepage menampilkan Drama-ID, DramaBox, Melolo, NetShort, DramaNova.
- Search berjalan.
- Detail drama terbuka dari card.
- Player episode memutar video bila upstream mengirim URL.
- Fullscreen memiliki tombol kembali dan dropdown episode.

## 9. Update release berikutnya

```bash
cd /www/wwwroot/dramashort
git pull
npm ci
npm run build
pm2 restart dramashort --update-env
```
