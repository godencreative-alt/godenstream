---
name: testing-shordrama
description: Test GodenStream shordrama UI end-to-end. Use when verifying platform sections, navbar routes, platform sorting, or shordrama search.
---

# GodenStream Shordrama Testing

## Devin Secrets Needed

- `API_KEY`: token for `https://captain.sapimu.au`. Use it as an environment variable when starting the local Next.js server; never commit it.

## Local setup

1. From the repo root, install dependencies if needed:
   ```bash
   npm install
   ```
2. Start the app with the upstream API token:
   ```bash
   API_KEY=$API_KEY npm run dev -- --hostname 0.0.0.0
   ```
3. Open `http://localhost:3000` in Chrome.

## Primary browser flow

Record the UI when testing. Verify these visible states:

1. Homepage hero mentions Drama-ID, DramaBox, Melolo, NetShort, and FreeReels.
2. Navbar shows only `Trending`, `Popular`, and `Terbaru`; old labels such as `Anime`, `MovieBox`, `iQIYI`, and `WeTV` should not appear in the top nav.
3. Homepage sections for Drama-ID, DramaBox, Melolo, and NetShort should render 10 cards and a `Selengkapnya` link.
4. FreeReels might return upstream `Auth failed`; if so, confirm the UI renders the `Konten FreeReels belum tersedia dari API.` fallback instead of a broken page.
5. Click Drama-ID `Selengkapnya` and confirm `/platform/drama-id` opens with `Trending`, `Popular`, and `Terbaru` sort buttons.
6. Click `Trending` on the platform page and verify the active button and visible card set change.
7. Click navbar `Trending`, `Popular`, and `Terbaru`; verify each URL/heading and populated grid.
8. Search from the navbar for a visible title fragment such as `Cinta`; verify URL is `/search?q=...`, not `/drama/search`, and the heading is `Cari Shordrama`.

## Notes

- Some upstream image URLs can fail or produce placeholder cards; treat a placeholder as acceptable when the title/provider card still renders.
- If all `/freereels/*` endpoints return `{"error":"Auth failed"}`, report it as upstream API/auth behavior rather than a frontend crash.
