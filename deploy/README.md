# Deploy GodenStream (aapanel + PM2 + nginx + Cloudflare)

Why fresh clones break, and how to deploy correctly.

## Why a fresh clone keeps breaking

`git pull` does **not** help — a fresh clone is already at the latest commit.
The problems come from things that are **not** in the repo:

1. **`.env` is gitignored** — contains `API_KEY`. Must be recreated each clone.
2. **`.next/standalone` is missing static assets** — Next.js `output: standalone`
   does NOT copy `.next/static` or `public/` into the standalone folder. The
   PM2 app runs `.next/standalone/server.js`, so without the copy step every
   JS/CSS chunk 404s and the browser falls back to a stale cached page.
3. **PM2 app must be registered** — `pm2 start ecosystem.config.cjs` once.
4. **nginx vhost config lives outside the repo** at
   `/www/server/panel/vhost/nginx/extension/stream.godenpg.dev/proxy.conf`
   (reference copy: `deploy/nginx-proxy.conf.example`).
5. **aapanel enables a global nginx `proxy_cache`** which caches stale HTML.
   The vhost config disables it with `proxy_cache off;` for `/` and `/api/`.

## One-time setup per server

```bash
# 1. Clone
git clone <repo> /www/wwwroot/stream.godenpg.dev
cd /www/wwwroot/stream.godenpg.dev

# 2. Create .env (copy template, fill API_KEY)
cp .env.example .env
#   then edit .env and set API_KEY=gp_...

# 3. Install the nginx vhost proxy config (aapanel path)
mkdir -p /www/server/panel/vhost/nginx/extension/stream.godenpg.dev
cp deploy/nginx-proxy.conf.example \
   /www/server/panel/vhost/nginx/extension/stream.godenpg.dev/proxy.conf
nginx -t && nginx -s reload

# 4. Deploy (build + sync standalone + start pm2)
bash deploy.sh
```

## Every redeploy (after pull or rebuild)

```bash
bash deploy.sh            # full: build + sync static + restart pm2
bash deploy.sh --quick    # skip build if .next is already current
```

`deploy.sh` is idempotent. It:
- installs deps if `node_modules` is missing
- builds (unless `--quick`)
- copies `.next/static` + `public/` into `.next/standalone`
- starts or restarts the `godenstream` PM2 app, then `pm2 save`

## Cloudflare note

If the site still serves stale HTML after deploy (old chunk references),
purge the Cloudflare cache for the zone. The nginx `proxy_cache off` +
`Cache-Control: no-store` on `/` keeps CF from caching HTML going forward.

## Useful commands

```bash
pm2 logs godenstream         # tail logs
pm2 restart godenstream      # restart (clears in-memory ISR cache)
curl -s https://stream.godenpg.dev/ | grep -c "0huzqp"   # 0 = fresh build served
```
