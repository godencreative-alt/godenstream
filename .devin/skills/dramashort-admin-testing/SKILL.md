---
name: dramashort-admin-testing
description: Test DramaShort admin dashboard, whitelabel settings, carousel, playback analytics, cache, and Cloudflare controls.
---

# DramaShort Admin Testing

Use this when testing the DramaShort admin dashboard or whitelabel features.

## Local setup

1. Install dependencies and build before browser testing:
   ```bash
   npm ci
   npm run build
   ```
2. Use a dedicated port for local testing, commonly `3027`.
3. Use isolated data/cache directories for repeatable admin tests:
   ```bash
   mkdir -p test-artifacts/pr7-data test-artifacts/pr7-cache
   ```
4. Run with server-side env vars only. Do not commit real secrets.
   ```bash
   API_KEY=<captain_api_token> \
   UPSTREAM_API_URL=https://captain.sapimu.au \
   ADMIN_USERNAME=admin \
   ADMIN_PASSWORD=admin123 \
   ADMIN_SESSION_SECRET=local-dev-secret \
   DRAMASHORT_DATA_DIR=$PWD/test-artifacts/pr7-data \
   DRAMASHORT_CACHE_DIR=$PWD/test-artifacts/pr7-cache \
   PORT=3027 \
   npm run dev
   ```
5. Open `http://localhost:3027`, not `127.0.0.1`, to avoid Next dev resource/HMR issues.

## Test account

For local development only, the default admin login is:
- Username: `admin`
- Password: `admin123`

Production should use configured `ADMIN_USERNAME`, `ADMIN_PASSWORD`, and `ADMIN_SESSION_SECRET` values or credentials rotated in `/admin`.

## Core E2E flow

Record browser testing when validating UI changes.

1. Homepage:
   - Hero contains `DramaShort untuk short drama pilihan.` or the configured whitelabel name.
   - Trending carousel renders visible drama covers/provider badges.
2. Admin login:
   - `/admin` redirects to `/admin/login` when unauthenticated.
   - Login form shows `Admin Dashboard`, username/password fields, and `Masuk`.
3. Dashboard:
   - After login, `/admin` shows visitor stats for today, 7 days, and month.
   - Top 20 watched table is visible.
   - Whitelabel, SEO, carousel, ads/anti-adblock, cache, Cloudflare, and admin account panels are visible.
4. Save whitelabel settings:
   - Change site name, tagline, footer text/copyright, carousel title/count/speed.
   - Save and expect `/admin?status=saved` plus `Settings tersimpan.`.
5. Public verification:
   - Reopen `/` and verify navbar, hero, carousel title, and footer reflect saved settings.
6. Playback analytics:
   - Open a populated NetShort/CashDrama detail page.
   - Play episode 1 long enough for watch analytics to post.
   - Return to `/admin` and verify the drama appears in Top 20 with count at least 1.
7. Cache/Cloudflare panels:
   - Verify controls are present.
   - Mark live R2 upload or Cloudflare zone mutation as untested unless relevant Cloudflare secrets are provided.

## Notes

- Cloudflare/R2 secrets should be supplied through secret management or environment variables, never committed.
- If upstream platform data is empty, switch to a populated platform such as NetShort or CashDrama for card/detail/playback proof.
- If video is unavailable for one provider, document the fallback and test a provider with a playable source.
