# Feedback Backend v3 — api.godenpg.dev (source-level audit 2026-06-14)

Audit ini beda dari v1/v2: dilakukan dengan **membaca kode backend langsung**
di `/www/wwwroot/godenpg.dev/backend/`, bukan black-box testing. Jadi setiap
temuan punya referensi file:line yang tepat.

Frontend stream.godenpg.dev: commit `c7fa026`.

## Kesimpulan utama

**Integrasi frontend SUDAH BENAR** — semua path & param yang frontend kirim
cocok dengan kontrak backend. Sisa masalah semuanya di **scraper/endpoint
backend**, bukan salah integrasi frontend.

---

## 1. COMIC `type` tidak mem-filter (manga/manhua/manhwa identik)

**Akar (backend):**
- Endpoint validasi `type` & pilih urutan source, lalu pass `comic_type` ke scraper:
  `backend/app/api/v1/endpoints/comic.py:144`
- Tapi scraper **tidak konsisten** filter by type:
  - BacaKomik: coba URL `/manga|/manhwa|/manhua`, lalu **fallback ke homepage generic**
    `backend/app/scrapers/bacakomik_scraper.py:187-204`
  - Komiku: cuma `manhwa` punya path khusus; `manga` & `manhua` fallback generic
    `backend/app/scrapers/komiku_scraper.py:207-218`
  - Search: semua scraper **abaikan** `comic_type` di URL
    `bacakomik_scraper.py:215-227`, `komiku_scraper.py:229-241`
- Endpoint lalu **menimpa** `item["type"] = comic_type`, menutupi type asli:
  `comic.py:149-152`

**Akibat:** `?type=manga`, `?type=manhua`, `?type=manhwa` bisa return kartu yang
sama persis, cuma field `type`-nya beda label. (Catatan: saat re-test 2026-06-14
sudah mulai beda — mungkin sudah ada perbaikan parsial. Mohon konfirmasi.)

**Saran:** scraper harus benar-benar query path/filter sesuai type, ATAU endpoint
post-filter item berdasarkan type asli dari scrape (jangan overwrite).

---

## 2. COMIC `popular` = `latest` (bukan popular asli)

**Akar:** `bacakomik`, `komiku`, `komikindo` tidak punya `get_popular_comics`,
jadi `_fetch_from_sources` skip dan endpoint fallback ke `get_latest_comics`:
- `comic.py:116-118` (skip kalau method tidak ada)
- `comic.py:177-181` (fallback ke latest)
- `mangasusu_scraper.py:33-35` (popular pun return latest)

**Saran:** implement `get_popular_comics` di minimal satu scraper, atau dokumentasikan
bahwa popular = latest supaya frontend tidak perlu section terpisah.

---

## 3. MOVIE embed not-found / stub (paling user-visible)

**Akar:** scraper movie return detail dict walau `sources: []` atau iframe placeholder,
dan `_fetch_from_sources` **tidak failover** ke scraper lain kalau detail sudah ada:
- `movie.py:78-80` (terima dict truthy apa pun, tidak require playable source)
- Dunia21 POST ke **hardcoded** `https://t21.press/data.php` dengan slug;
  kalau slug tidak ter-index → sentinel not-found:
  `dunia21_scraper.py:294-296`, filter not-found `:246-253`, `:305-308`
- Dunia21 return `None` HANYA kalau title kosong DAN sources kosong — kalau title
  ada tapi sources kosong, tetap return detail stub: `dunia21_scraper.py:314-315`
- LK21 ambil iframe pertama tanpa filter: `lk21_scraper.py:269-277`
- Lurvz/Rebahin terima iframe kecuali ada di denylist kecil:
  `lurvz_scraper.py:288-306`, `rebahinxxi_scraper.py:254-273`

**Akibat:** `/movie/{slug}/sources` bisa balik embed stub `t21.press/not-found.html`
atau player dari provider salah, padahal harusnya failover ke source lain.

**Saran:** di `_fetch_from_sources` untuk `get_movie_sources`, anggap detail dengan
`sources: []` sebagai MISS dan lanjut failover ke scraper berikutnya. Plus
normalisasi/validasi iframe URL (tolak yang mengandung `not-found`, `notfound`).

---

## 4. DONGHUA sebagian episode 0 sources

**Akar:** anichin scraper kumpulkan source dari selector `iframe[src]`,
`video source[src]`, dan download links. Kalau selector tidak match (markup berubah
atau Playwright gagal render), return dict dengan `sources: []`:
- `anichin_scraper.py:343-401`
- Endpoint lalu label **semua** empty-sources sebagai `"not yet uploaded"`:
  `donghua.py:221-252`

**Masalah:** label "not yet uploaded" menutupi kemungkinan **bug selector scraper**.
Episode yang sebenarnya punya player bisa salah dilaporkan kosong.

**Saran:** bedakan "page tidak ada" (404 asli) vs "page ada tapi selector miss"
(kemungkinan bug scraper, perlu alert/log) vs "memang belum upload".

---

## 5. ANIME tidak punya `type` (tidak ada Hentai)

**Akar:** endpoint anime tidak punya param `type` sama sekali; cuma pakai
`otakudesu_scraper`:
- `anime.py:80-84`, `:151-155`, `:219-223` (signatures: cuma genre/page)
- Tidak ada source hentai aktif (`scraper_registry.py:33` cuma komentar)

**Status frontend:** chip "Hentai" sudah disabled "soon" — benar. Butuh backend
tambah `type` param + scraper hentai untuk mengaktifkan.

**Bonus bug:** anime `search` terima `genre` & `page` tapi keduanya tidak efektif —
`genre` cuma masuk cache key, `page` tidak diteruskan ke scraper:
`anime.py:165`, `:189`.

---

## 6. ADULT — catatan akurat

- Valid `type`: `jav`, `korea`, `indonesia`, `west`. `west` = list kosong → 404
  "not available yet": `adult.py:29-34`, `:70-73`. (Frontend chip West disabled — benar.)
- **Tidak ada** scraper "tetelolet.store" di backend. URL `tetelolet.store` yang
  muncul saat re-test itu **output dari scraper javhey/javtsunami/javsubidi** saat
  menemukan URL `.m3u8` (mereka set source `type: "hls"`):
  `javhey_scraper.py:591-597`, `javsubidi_scraper.py:490-495`, `javtsunami_scraper.py:502-507`
- Jadi adult HLS playback **sudah berfungsi** via frontend `pickPlayback()` — bukan
  masalah lagi.

---

## 7. Fix yang sudah dilakukan frontend sesi ini

- `fetchDonghuaPopular` berhenti kirim param `source` yang backend abaikan
  (donghua popular hardcode anichin, tidak terima `source`): commit `c7fa026`.

---

## 8. Peluang yang belum dimanfaatkan

- Backend punya **dynamic genre router** di `/api/v1/{genre}` dan `/api/v1/extra/{genre}`
  (`main.py:758-774`) yang frontend belum pakai. Bisa jadi jalur untuk kategori
  tambahan tanpa nambah endpoint hand-written.
- Endpoint `/api/v1/adult/popular` ada di backend (`adult.py:132`) tapi frontend
  belum panggil (cuma latest/search/detail).

---

## Prioritas (urutan dampak ke user)

1. **MOVIE embed failover** (#3) — section playback paling sering gagal
2. **COMIC type filter** (#1) — 3 chip tampilkan data sama
3. **DONGHUA selector robustness** (#4) — episode salah dilabeli kosong
4. **COMIC popular** (#2) — cosmetic, popular=latest
5. **ANIME type/hentai** (#5) — fitur baru, butuh scraper baru

Frontend tidak butuh perubahan lagi untuk #1-#5 — semua memuat persis apa yang
backend kembalikan. Perbaikan ada di scraper & logic failover backend.
