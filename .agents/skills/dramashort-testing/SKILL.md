---
name: dramashort-testing
description: Verified setup and E2E testing workflow for the DramaShort shordrama app.
---

# DramaShort Testing Workflow

Use this skill when testing DramaShort UI, playback, security-readiness, or deployment documentation changes.

## Local setup

1. Install dependencies from repo root:
   ```bash
   npm install
   ```
2. Ensure the upstream API token is available as a server-only environment variable:
   ```bash
   API_KEY=<stored secret>
   NEXT_PUBLIC_API_BASE=/api/proxy
   UPSTREAM_API_URL=https://captain.sapimu.au
   ```
   Do not expose the API key via `NEXT_PUBLIC_*` variables.
3. Start the dev server:
   ```bash
   npm run dev
   ```
4. Open `http://localhost:3000` in the VM browser.

## Required checks

Run these before finalizing code changes:

```bash
npm run build
npm audit --audit-level=moderate
```

For runtime smoke checks, verify:

```bash
curl -I http://localhost:3000/
curl -I http://localhost:3000/icon-192.png
```

## Browser E2E path

Record UI tests when validating player or navigation changes.

1. Homepage shows DramaShort branding and five platforms: Drama-ID, DramaBox, Melolo, NetShort, DramaNova.
2. Open a playable NetShort card such as `Luna yang 5 Kali Ditolak`.
3. Verify detail route `/shordrama/netshort/<id>` shows episode count and `Putar Episode 1`.
4. Open episode 1 and verify player route `/shordrama/netshort/<id>/1` does not show `Video belum tersedia`.
5. Click Play and verify playback time/frame advances.
6. Enter fullscreen and verify back/exit button, episode dropdown, and player controls remain visible.
7. Double-tap/click the video area and verify `+10 detik` appears and playback seeks forward.
8. Check Trending, Popular, and Terbaru pages show all platform filter chips.
9. Open `Lainnya` dropdown and verify Syarat dan Ketentuan, Kebijakan Privasi, DMCA, and Tentang pages return 200 and show the expected headings.
10. Use navbar search and verify it navigates to `/search?q=<query>`.

## Known upstream behavior

Some providers/episodes may return no playable video URL from `captain.sapimu.au`; the expected app behavior is a graceful `Video belum tersedia` fallback, not a crash.
