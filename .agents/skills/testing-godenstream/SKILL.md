---
name: testing-godenstream
description: Test GodenStream shordrama navigation and playback flows end-to-end. Use when verifying UI changes, platform sections, detail pages, episode selectors, or video playback.
---

# GodenStream Testing

## Devin Secrets Needed

- `API_KEY`: captain.sapimu.au API token used by the local `/api/proxy` route. Do not hard-code this in files or reports.

## Local Setup

1. Install dependencies from the repo root:
   ```bash
   npm install
   ```
2. Start the Next.js dev server with the API token available to the server process:
   ```bash
   API_KEY="$API_KEY" npm run dev
   ```
3. If port `3000` is already in use by another Next dev server for this repo, use that running server rather than starting a duplicate. Confirm it is reachable at `http://localhost:3000`.
4. For UI recordings, maximize Chrome before recording:
   ```bash
   sudo apt-get install -y wmctrl 2>/dev/null; wmctrl -r :ACTIVE: -b add,maximized_vert,maximized_horz
   ```

## Useful Verification Commands

- Build: `npm run build`
- No dedicated lint or test scripts are currently defined in `package.json`.
- Quick proxy sanity checks can be run against the local app:
  - `/api/proxy/idrama/api/v1/latest?page=1&limit=2&lang=id`
  - `/api/proxy/netshort/api/v1/new/1?lang=id_ID`
  - `/api/proxy/dramanova/api/v1/dramas?lang=in&page=1&size=2`

## Shordrama Playback Flow

Use NetShort as the strongest repeatable playback proof when available:

1. Open `http://localhost:3000/`.
2. In the NetShort section, click `Luna yang 5 Kali Ditolak` if present.
3. Verify the detail route is `/shordrama/netshort/2048604612075716609` and the page shows:
   - `Luna yang 5 Kali Ditolak`
   - `NetShort`
   - `58 Episode`
   - `Putar Episode 1`
4. Click `Putar Episode 1`.
5. Verify `/shordrama/netshort/2048604612075716609/1` renders the video player and does not show `Video belum tersedia`.
6. Click Play and confirm frames advance. If controls are visible, the play button should change to Pause and the time should advance.
7. Test a later episode route (for example EP7) to ensure it either renders a player or shows the exact graceful fallback text:
   - `Video belum tersedia`
   - `API NetShort belum mengirim URL video untuk episode ini.`

## Platform Limitations to Watch

- Drama-ID, NetShort, and DramaNova may return playable URLs through the proxy when `API_KEY` is present.
- DramaBox and Melolo might provide detail/episode metadata but not playable URLs. Treat a clear `Video belum tersedia` fallback as acceptable unless the task explicitly requires alternate upstream endpoints.
- If all shordrama API routes return 403/Cloudflare errors, verify the local server has `API_KEY` loaded before asking the user for help.

## Reporting

- For PR testing, post one concise PR comment with collapsed details and include the Devin session link.
- Attach a recording for browser playback tests.
- Include inline screenshots in the detailed markdown report; do not submit a text-only report.
