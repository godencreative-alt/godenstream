#!/bin/bash
# Deploy GodenStream after a fresh clone or pull.
# Idempotent: safe to run repeatedly.
#
# Usage:
#   bash deploy.sh                # full deploy: build + sync standalone + (re)start pm2
#   bash deploy.sh --quick        # skip build (assume .next is already fresh)
#
# Prereqs (one-time, NOT done by this script):
#   - Node + npm + pm2 installed
#   - .env file present (copy from .env.example and fill API_KEY)
#   - nginx vhost configured with proxy.conf in
#       /www/server/panel/vhost/nginx/extension/stream.godenpg.dev/proxy.conf

set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

QUICK=false
[ "${1:-}" = "--quick" ] && QUICK=true

# --- 1. Check .env exists ---
if [ ! -f .env ]; then
  echo "ERROR: .env not found. Copy .env.example to .env and fill in API_KEY." >&2
  exit 1
fi

# --- 2. Install deps if missing ---
if [ ! -d node_modules ]; then
  echo "==> Installing npm deps"
  npm install --no-audit --no-fund
fi

# --- 3. Build (skip with --quick) ---
if [ "$QUICK" = false ]; then
  echo "==> Building Next.js (production)"
  npm run build
fi

# --- 4. Sync static + public into standalone (Next standalone doesn't auto-copy) ---
echo "==> Syncing static + public into .next/standalone"
mkdir -p .next/standalone/.next
rm -rf .next/standalone/.next/static
cp -r .next/static .next/standalone/.next/static
rm -rf .next/standalone/public
cp -r public .next/standalone/public

# --- 5. Start or restart PM2 ---
if pm2 jlist 2>/dev/null | grep -q '"name":"godenstream"'; then
  echo "==> Restarting godenstream (clears ISR in-memory cache)"
  pm2 restart godenstream --update-env
else
  echo "==> Starting godenstream via ecosystem.config.cjs"
  pm2 start ecosystem.config.cjs
fi

pm2 save >/dev/null

echo
echo "==> Deploy complete."
echo "    Site:  https://stream.godenpg.dev/"
echo "    Logs:  pm2 logs godenstream"
