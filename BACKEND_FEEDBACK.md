# Feedback Backend — api.godenpg.dev

Tested: 2026-06-13. Frontend: stream.godenpg.dev (Next.js, Bahasa+English).
Setiap section di-test end-to-end (list → detail → episode → sources → thumbnail).

## 1. CRITICAL — Drama section kosong total

Semua endpoint drama return `404 "No popular/dramas found"` untuk **setiap** type yang sudah saya coba: `drakor`, `jdrama`, `cdrama`, `shortdrama`, `dracin`, `tencent`, `iqiyi`, `wetv`, `moviebox`, `dramabox`, `melolo`, `netshort`, `freereels`, dan tanpa `type`.

```
404 GET /api/v1/drama/popular?type=drakor    → "No popular dramas found"
404 GET /api/v1/drama/latest?type=drakor     → "No dramas found"
404 GET /api/v1/drama/search?q=love          → "No dramas found for query: love"
200 GET /api/v1/drama/genres?type=drakor     → 14 genres returned (works)
```

Genres jalan (14 item: Action/Adventure/Comedy/Drama/Romance/dst), tapi list/search semuanya 0 hasil. Sepertinya scraper drama belum populate data ke DB sama sekali.

**Dampak frontend:** halaman `/drama`, `/drama/popular`, `/drama/browse`, `/drama/search` semuanya menampilkan ErrorState (handle sudah ada, tapi useless tanpa data).

**Yang dibutuhkan:** confirm type valid yang bener mana (mungkin nama type bukan satupun yang saya coba?), atau populate scraper drama.

---

## 2. HIGH — Cold response times sangat lambat

Diukur dari edge (server kami) ke `api.godenpg.dev` dengan API key valid:

| Endpoint | Cold (s) | Warm (s) |
|---|---|---|
| `/api/v1/anime/popular` | 26.5 | 0.2 |
| `/api/v1/comic/popular` | 8.9 / 6.5 | 0.5 |
| `/api/v1/movie/popular` | 8.5 / 5.0 | 0.5 |
| `/api/v1/donghua/popular` | 6.0 | 0.5 |
| `/api/v1/anime/{slug}` (detail) | 24.7 | — |
| `/api/v1/donghua/{slug}` (detail) | 23.5 / 26.5 | — |
| `/api/v1/anime/episode/{slug}/sources` | timeout 30s (1×) | 0.1-0.3 |

**Asumsi penyebab:** scraper sync (fetch HTML upstream + parse) per request, tidak ada warm cache di backend.

**Mitigasi sementara di frontend (sudah dipasang):** `Cache-Control: max-age=300, stale-while-revalidate=86400` di proxy untuk content list/detail. User dapat data dari edge cache instant, refresh background. Tapi cold pertama tetap 5-27s.

**Yang dibutuhkan:** redis/memory cache di backend, TTL 5-10 menit untuk list/popular, 1 jam untuk detail. Atau scheduled prefetcher buat top 100 popular slot.

---

## 4. MEDIUM — Inkonsistensi anime/episode/sources timeout

Pertama call timeout 30s (no response), retry langsung 0.13s response. Sekitar 50% chance pada cold cache. Reproducible:

```
attempt 1: 000 30.002s   (timeout, no headers)
attempt 2: 200 0.13s     (success immediately)
```

**Dugaan:** scraper sumber video kena hang upstream (otakudesu/desustream lambat), tidak ada timeout internal di backend, koneksi mati di edge.

**Yang dibutuhkan:** internal timeout (mis. 20s) di backend dengan return 504 yang jelas, supaya client bisa retry-aware.

---

## 5. MEDIUM — Asset endpoint kadang 502 di first hit

`/api/v1/asset/<base64>` — first hit untuk asset yang belum di-cache backend kadang return 502 mid-bake (saat lagi fetch+cache asset eksternal). Retry langsung 200. Sudah saya pasang auto-retry di frontend proxy (1× retry, 250ms backoff) jadi user tidak lihat broken image.

**Yang dibutuhkan (low priority):** internal cache lock supaya request paralel ke asset yang sama tidak race ke 502. Frontend mitigation cukup, tapi 502 mid-bake masuk error log nginx.

---

## 6. INFO — Yang sudah jalan baik

- Genres untuk semua section: 200, instan.
- Comic detail + chapters + images: 5-7s cold, image dari komiku.org direct (frontend handle via /api/img referer override).
- Adult detail + sources: 9s + 5s, return inline `sources` dan separate `/sources` endpoint, frontend pakai keduanya sebagai fallback.
- Donghua detail dengan slug yang benar dari list: 200 (lambat, tapi konsisten).
- Thumbnail asset (semua section): 0.1-3s cold, instant warm. Referer header per-host CDN sudah handle backend.
- Anime/latest: 0.2s (sudah cached!).

---

## Slug yang dipakai untuk testing (untuk reproduce)

```
anime:    kill-ao-sub-indo
                 → episode: klao-episode-10-sub-indo
donghua:  a-record-of-a-mortals-journey-to-immortality-episode-178-subtitle-indonesia
movie:    feel-my-voice-2026
comic:    devil-returns-to-school-days
                 → chapter: devil-returns-to-school-days-chapter-02
adult:    avop-002-terjebak-rayuan-nakal-bos-suamiku-hikaru-kanda  (type=jav)
```

API key yang dipakai: `gp_lg34sgdouecUFQpGoYYNrw7oyfya3CnJgviafvkQjyI` (production).

---

## Prioritas rekomendasi

1. **Drama populate** — paling user-visible, full section dead.
2. **Anime `type` param + Hentai scrape** — frontend sudah punya toggle Anime/Hentai (Hentai disabled "soon"). Backend perlu tambah `type` param di `/api/v1/anime/*` dan scraper untuk hentai source. Tanpa ini, toggle Hentai cuma placeholder.
3. **Adult `type=west`** — backend return 404 "Adult type 'west' is not available yet". Frontend chip West sudah disabled. Aktifkan saat scraper west siap.
4. **Backend cache** — sekali jadi, semua section jadi snappy.
2. **Backend cache** — sekali jadi, semua section jadi snappy.
3. **Anime episode/sources timeout consistency** — lower priority, sudah ter-mitigasi.
