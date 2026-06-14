# Feedback Backend v2 — api.godenpg.dev (re-test 2026-06-14)

Tested ulang setelah backend terima `BACKEND_FEEDBACK.md` (v1, 2026-06-13).
Frontend production: stream.godenpg.dev (commit `cc85be0`).

## TL;DR

| # | Section | v1 (2026-06-13) | v2 (2026-06-14) | Status |
|---|---|---|---|---|
| 1 | Drama | 404 semua type | 200, `data: []` kosong | 🟡 progress (route hidup, data nol) |
| 2 | Comic `type` | manga/manhua/manhwa identik | masih identik | 🔴 unchanged |
| 3 | Movie embed | `rts.gdn/s/{slug}/` (stub) | `t21.press/not-found.html?data=oke` | 🔴 still broken (URL beda, sama-sama bukan player) |
| 4 | Adult player | `ply.streamv.site` `<video>` tak init | masih sama | 🔴 unchanged |
| 5 | Donghua sources | konsisten 16 sources | inkonsisten — 0 atau 16 | 🟡 regression: sebagian episode kosong |

Yang **berfungsi** (tidak perlu sentuh): anime sources, donghua episode yang punya sources, comic chapter images, thumbnail semua section, type chips frontend.

---

## 1. 🟡 Drama: 200 OK tapi `data: []` kosong

Sebelumnya: 404 "No popular dramas found" untuk semua 13 type variant.
Sekarang: 200 OK dengan body `{"status":"success","data":[]}`.

Reproduksi:
```
GET /api/v1/drama/popular?type=drakor   → 200, data:[]
GET /api/v1/drama/latest?type=drakor    → 200, data:[]
GET /api/v1/drama/search?q=love         → 200, data:[]
GET /api/v1/drama/genres?type=drakor    → 200, 14 genres ✓
```

Endpoint sudah hidup, scraper tinggal populate. Genres-nya benar (14 item).
Frontend `ErrorState` masih akan tampil karena `data.length === 0`.

---

## 2. 🔴 Comic: `type` param diabaikan

Reproduksi (item pertama dari setiap type):
```
GET /api/v1/comic/latest?type=manga    → "Leveling In The Future (Apex Future Martial Arts)"
GET /api/v1/comic/latest?type=manhua   → "Leveling In The Future (Apex Future Martial Arts)"
GET /api/v1/comic/latest?type=manhwa   → "Leveling In The Future (Apex Future Martial Arts)"
GET /api/v1/comic/latest?type=adult    → "She's a Married Woman"
```

Tiga type pertama return data identik. Hanya `adult` yang punya filter berfungsi.
Cek scraper bacakomik/komikindo — query parameter `type` mungkin tidak diterapkan,
atau scraper hanya menarik dari satu source feed.

Frontend sudah expose 4 chip type (`Manga / Manhua / Manhwa / Adult`) dan pass ke
backend. Tinggal backend respect param-nya.

---

## 3. 🔴 Movie embed masih halaman 404

Sebelumnya: `https://rts.gdn/s/{slug}/` (loading spinner stub).
Sekarang: `https://t21.press/not-found.html?data=oke` (literal halaman "Kesalahan 404").

Reproduksi:
```
GET /api/v1/movie/affection-2025/sources
→ {"sources":[{"type":"embed","url":"/api/v1/asset/aHR0cHM6Ly90MjEucHJlc3Mvbm90LWZvdW5kLmh0bWw_ZGF0YT1va2U"}]}
```

`base64-decode` → `https://t21.press/not-found.html?data=oke`

Halaman itu raw render text "Kesalahan 404", bukan player. Iframe load berhasil,
tapi tidak ada `<video>`/`<iframe>`/`.m3u8`/JS player di dalamnya.

Scraper terbit21 mungkin membuang URL embed asli dan jatuh ke fallback not-found
saat extract player URL. Cek logic extract iframe src dari halaman terbit21
detail page.

---

## 4. 🔴 Adult player tidak init `<video>`

Reproduksi:
```
GET /api/v1/adult/avop-002-terjebak-rayuan-nakal-bos-suamiku-hikaru-kanda?type=jav
→ sources: [{type:"embed", url:"/api/v1/asset/aHR0cHM6Ly9wbHkuc3RyZWFtdi5zaXRlL2VtLzQ5emM5NG8"}]
```

Decode → `https://ply.streamv.site/em/49zc94o`

Iframe load 200 OK, title `"49zc94o - Player"`, tapi:
- `document.querySelectorAll('video').length === 0` (player JS tak inisialisasi `<video>`)
- Hanya nested iframe `t.dtscout.com` (tracking/analytics) yang muncul
- Test tanpa sandbox sama sekali — hasil identik
- Test dengan referer `streamv.site` / `stream.godenpg.dev` / kosong — body identik (12634 bytes)

Bukan masalah sandbox/referer/CSP. Player JS di `ply.streamv.site` failing untuk
init video element, kemungkinan bot-detection / geo-block / butuh user click /
fingerprinting check.

Saran: ekstrak URL m3u8/mp4 langsung dari player page (skip wrapper) dan kasih
sebagai source `type=hls`/`mp4`. Frontend kami sudah siap memutar HLS/MP4 langsung
via custom `<VideoPlayer>` (HLS.js + quality switcher + resume + subtitle).

---

## 5. 🟡 Donghua: sebagian episode return 0 sources

Reproduksi:
```
GET /api/v1/donghua/episode/tales-of-herding-gods-episode-87-subtitle-indonesia
→ data.sources: []  ← KOSONG, episode tidak playable

GET /api/v1/donghua/episode/battle-through-the-heavens-season-5-episode-203-subtitle-indonesia
→ data.sources: 16 items  ← jalan, dailymotion embed
```

Sesi sebelumnya (v1 test) episode pertama `tales-of-herding-gods` baru saja
top-of-popular dan punya sources. Sekarang konsisten kosong. Mungkin race
saat scraper anichin belum selesai populate episode baru.

---

## Endpoint yang tidak berubah dari v1 (masih sama issue-nya)

- **Anime `type` param + Hentai scrape** — frontend toggle Hentai disabled "soon".
  Backend perlu tambah `type` param di `/api/v1/anime/*`.
- **Adult `type=west`** — backend masih return 404 "Adult type 'west' is not available yet".
  Frontend chip West sudah disabled "soon".
- **Cold-scrape latency** — list 5-9s, detail 23-27s di first hit. Frontend sudah
  set `Cache-Control: max-age=300, stale-while-revalidate=86400` jadi cold cuma
  kena sekali per 5 menit. Tetap perlu redis/memory cache di backend.

---

## Slug & data untuk reproduce (production API key)

```
API key: gp_lg34sgdouecUFQpGoYYNrw7oyfya3CnJgviafvkQjyI

Movie:    affection-2025
Comic:    leveling-in-the-future-apex-future-martial-arts
Donghua:  tales-of-herding-gods-episode-87-subtitle-indonesia (kosong)
          battle-through-the-heavens-season-5-episode-203-subtitle-indonesia (jalan)
Anime:    tttnw-s2-sub-indo  → ep tttnw-s2-episode-10-sub-indo
Adult:    avop-002-terjebak-rayuan-nakal-bos-suamiku-hikaru-kanda?type=jav
```

---

## Prioritas (urutan dampak ke user)

1. **Movie embed** — full section playback dead, paling visible
2. **Comic type** — 3 dari 4 chip menampilkan data sama, user bingung
3. **Drama populate** — section ada genres tapi 0 konten
4. **Adult player** — section utama tapi konten tidak playable
5. **Donghua sources** — sebagian episode kosong (regression dari v1)

Frontend sisi kami **tidak ada lagi yang perlu di-fix** untuk lima masalah ini —
semua memuat persis apa yang backend kembalikan. Saat backend perbaiki scraper /
pilih embed host yang playable, video akan otomatis berfungsi tanpa perubahan
frontend.
