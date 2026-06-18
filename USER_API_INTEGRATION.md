# GODENPG User API Integration Guide

Dokumen ini untuk partner/frontend/mobile yang mau integrasi ke API publik GODENPG.

## 1. Base URL

```http
https://api.godenpg.dev/api/v1
```

Contoh lengkap:

```http
GET https://api.godenpg.dev/api/v1/anime/latest?page=1
```

## 2. Authentication

Semua endpoint konten user-facing perlu API key.

```http
X-API-Key: <api_key>
Accept: application/json
```

Contoh curl:

```bash
curl -H "X-API-Key: gp_xxx" \
  "https://api.godenpg.dev/api/v1/anime/latest?page=1"
```

## 3. Response umum

### List response

```json
{
  "status": "success",
  "data": [
    {
      "title": "Judul Konten",
      "slug": "judul-konten",
      "thumbnail": "https://...",
      "url": "https://...",
      "category": "anime",
      "in_vault": false
    }
  ],
  "cache": {
    "cached": false,
    "ttl": 900
  },
  "meta": {
    "page": 1,
    "total_items": 12,
    "has_next_page": true
  }
}
```

### Detail response

```json
{
  "status": "success",
  "data": {
    "title": "Judul Konten",
    "slug": "judul-konten",
    "thumbnail": "https://...",
    "synopsis": "...",
    "info": {},
    "in_vault": false
  },
  "cache": {
    "cached": false,
    "ttl": 3600
  },
  "meta": {}
}
```

### Error response

```json
{
  "detail": "No items found"
}
```

Common status:

| Code | Meaning |
| --- | --- |
| `200` | Success |
| `400` | Query/source/type invalid |
| `401` | API key missing/invalid |
| `403` | IP tidak whitelist / stream token invalid |
| `404` | Konten tidak ditemukan |
| `429` | Rate limit |
| `500` | Server error |
| `502` | Upstream/storage gagal |
| `503` | Storage backend belum configured |
| `504` | Upstream timeout |

## 4. Parameter umum

| Param | Dipakai di | Arti |
| --- | --- | --- |
| `page` | list/search/popular | Nomor halaman, default `1` |
| `q` | search | Keyword pencarian |
| `genre` | list/search/popular | Filter genre text |
| `source` | multi-source endpoint | Paksa source tertentu; kosong = auto/merged sesuai endpoint |
| `type` | comic/adult | Subtipe konten |

## 5. Kategori endpoint ringkas

| Category | Prefix | Status | Catatan |
| --- | --- | --- | --- |
| Anime | `/anime` | Aktif | merged latest/search/popular |
| Donghua | `/donghua` | Aktif | merged latest, failover detail/episode |
| Comic | `/comic` | Aktif | manga/manhwa/manhua/adult |
| Movie | `/movie` | Aktif | multi-source failover |
| Adult | `/adult` | Aktif | integrated per subkategori `west`/`indonesia` |
| Entertainment | `/entertainment` | Aktif | convenience feed `movie`/`adult`/`semi` |
| Vault | `/vault` | Aktif | resolve cached content + signed stream |
| Extra Generic | `/extra/{genre}` | Aktif terbatas | registry scraper tambahan |
| Drama/Dracin | `/drama` | Nonaktif | router belum dimount di live API |

---

# 6. Anime API

Prefix:

```http
/api/v1/anime
```

Source utama:

- `otakudesu`
- generic anime registry jika tersedia

## Endpoints

```http
GET /anime/latest?page=1&genre=action
GET /anime/popular?page=1&genre=action
GET /anime/search?q=naruto&page=1&genre=action
GET /anime/genres
GET /anime/{slug}
GET /anime/{slug}/episodes
GET /anime/episode/{episode_slug}/download
GET /anime/episode/{episode_slug}/sources
```

## Contoh latest

```bash
curl -H "X-API-Key: gp_xxx" \
  "https://api.godenpg.dev/api/v1/anime/latest?page=1"
```

Response:

```json
{
  "status": "success",
  "data": [
    {
      "title": "Naruto Shippuden",
      "slug": "naruto-shippuden",
      "url": "https://...",
      "thumbnail": "https://...",
      "source": "otakudesu",
      "in_vault": false
    }
  ],
  "cache": { "cached": false, "ttl": 900 },
  "meta": {
    "page": 1,
    "total_items": 1,
    "sources": ["otakudesu"],
    "has_next_page": false
  }
}
```

## Contoh episode sources

```http
GET /anime/episode/naruto-shippuden-episode-1/sources
```

Response:

```json
{
  "status": "success",
  "data": {
    "title": "Episode 1",
    "sources": [
      { "type": "embed", "url": "https://...", "label": "Embed" },
      { "type": "mp4", "url": "https://...", "quality": "720p" }
    ]
  },
  "cache": { "cached": false }
}
```

---

# 7. Donghua API

Prefix:

```http
/api/v1/donghua
```

Source:

- `anichin`
- `donghuastream`
- kosong / `auto` / `all` untuk merged latest

## Endpoints

```http
GET /donghua/latest?page=1&source=auto
GET /donghua/popular?page=1
GET /donghua/search?q=battle&page=1&source=anichin
GET /donghua/genres
GET /donghua/{slug}?source=anichin
GET /donghua/{slug}/episodes?source=anichin
GET /donghua/episode/{episode_slug}?source=anichin
```

## Contoh latest merged

```bash
curl -H "X-API-Key: gp_xxx" \
  "https://api.godenpg.dev/api/v1/donghua/latest?page=1"
```

Response:

```json
{
  "status": "success",
  "data": [
    {
      "title": "Battle Through the Heavens",
      "slug": "battle-through-the-heavens-episode-200",
      "thumbnail": "https://...",
      "episode": "Episode 200",
      "source": "anichin",
      "in_vault": false
    }
  ],
  "cache": { "cached": false, "ttl": 900 },
  "meta": {
    "page": 1,
    "source": "merged",
    "sources": ["anichin", "donghuastream"],
    "total_items": 1,
    "has_next_page": false
  }
}
```

## Contoh episode playback

```http
GET /donghua/episode/battle-through-the-heavens-episode-200
```

Response:

```json
{
  "status": "success",
  "data": {
    "title": "Battle Through the Heavens Episode 200",
    "sources": [
      { "type": "embed", "url": "https://...", "label": "Player" }
    ]
  },
  "cache": { "cached": false },
  "meta": { "source": "anichin" }
}
```

---

# 8. Comic API

Prefix:

```http
/api/v1/comic
```

Types:

- `manga`
- `manhwa`
- `manhua`
- `adult`

Source selection:

- kosong = merge semua source valid untuk type, kecuali `type=adult` default ke `mangasusu`
- isi `source=<id>` untuk paksa 1 source

## Endpoints

```http
GET /comic/latest?type=manga&page=1&genre=action
GET /comic/popular?type=manhwa&page=1
GET /comic/search?q=solo&type=manhwa&page=1
GET /comic/genres?type=manga
GET /comic/{comic_slug}?type=manga
GET /comic/{comic_slug}/chapters?type=manga
GET /comic/chapter/{chapter_slug}/images?type=manga
```

## Contoh latest manhwa

```bash
curl -H "X-API-Key: gp_xxx" \
  "https://api.godenpg.dev/api/v1/comic/latest?type=manhwa&page=1"
```

Response:

```json
{
  "status": "success",
  "data": [
    {
      "title": "Solo Leveling",
      "slug": "solo-leveling",
      "thumbnail": "https://...",
      "latest_chapter": "Chapter 200",
      "type": "manhwa",
      "source": "komikindo",
      "in_vault": false
    }
  ],
  "cache": { "cached": false, "ttl": 900 },
  "meta": {
    "category": "comic",
    "type": "manhwa",
    "source": "merged",
    "sources": ["komikindo", "bacakomik"],
    "failover": true,
    "genre": null,
    "page": 1,
    "total": 1,
    "has_next_page": false
  }
}
```

## Contoh chapter images

```http
GET /comic/chapter/solo-leveling-chapter-1/images?type=manhwa
```

Response:

```json
{
  "status": "success",
  "data": [
    "https://api.godenpg.dev/api/v1/asset?url=...",
    "https://api.godenpg.dev/api/v1/asset?url=..."
  ],
  "cache": { "cached": false, "ttl": 3600 },
  "meta": {
    "category": "comic",
    "type": "manhwa",
    "source": "komikindo",
    "failover": false,
    "total": 2
  }
}
```

---

# 9. Movie API

Prefix:

```http
/api/v1/movie
```

Sources:

- `lk21`
- `rebahinxxi`
- `lurvz`
- `dunia21`
- `movieloop`
- `movie-ip168`
- `movie-ip152`

Kosongkan `source` untuk auto/failover. Isi `source=<id>` untuk paksa source.

## Endpoints

```http
GET /movie/latest?page=1&genre=action
GET /movie/popular?page=1&genre=action
GET /movie/search?q=avengers&page=1
GET /movie/genres
GET /movie/{slug}
GET /movie/{slug}/sources
```

## Contoh search

```bash
curl -H "X-API-Key: gp_xxx" \
  "https://api.godenpg.dev/api/v1/movie/search?q=avengers&page=1"
```

Response:

```json
{
  "status": "success",
  "data": [
    {
      "title": "Avengers",
      "slug": "avengers",
      "thumbnail": "https://...",
      "category": "movie",
      "source": "lk21",
      "in_vault": false
    }
  ],
  "cache": { "cached": false, "ttl": 1800 },
  "meta": {
    "category": "movie",
    "query": "avengers",
    "genre": null,
    "source": "lk21",
    "failover": false,
    "page": 1,
    "total": 1,
    "has_next_page": false
  }
}
```

## Contoh movie sources

```http
GET /movie/avengers/sources
```

Response:

```json
{
  "status": "success",
  "data": {
    "sources": [
      { "type": "embed", "url": "https://...", "label": "Player" },
      { "type": "download", "url": "https://...", "quality": "720p" }
    ]
  },
  "cache": { "cached": false },
  "meta": {
    "category": "movie",
    "source": "lk21",
    "failover": false
  }
}
```

---

# 10. Adult API

Prefix:

```http
/api/v1/adult
```

User integration pakai subkategori, bukan target langsung.

## Types

### `west`

Merged source:

- `viralxxxporn`
- `ixxx`
- `porn-bokep`

### `indonesia`

Merged source:

- `bokepindo18`
- `igodesu`
- `videobokep`
- fallback legacy: `mbokepindo`

Internal lama masih ada:

- `jav`
- `asia` / alias `korea`

## Endpoints

```http
GET /adult/latest?type=west&page=1
GET /adult/popular?type=indonesia&page=1
GET /adult/search?q=keyword&type=west&page=1
GET /adult/genres?type=west
GET /adult/{slug}?type=west
GET /adult/{slug}/sources?type=west
```

## Contoh latest west

```bash
curl -H "X-API-Key: gp_xxx" \
  "https://api.godenpg.dev/api/v1/adult/latest?type=west&page=1"
```

Response:

```json
{
  "status": "success",
  "data": [
    {
      "title": "Contoh Video",
      "slug": "contoh-video",
      "thumbnail": "https://...",
      "url": "https://...",
      "category": "adult",
      "type": "west",
      "source": "ixxx",
      "in_vault": false
    }
  ],
  "cache": { "cached": false, "ttl": 900 },
  "meta": {
    "category": "adult",
    "type": "west",
    "genre": null,
    "source": "merged",
    "sources": ["viralxxxporn", "ixxx", "porn-bokep"],
    "failover": false,
    "page": 1,
    "total": 1,
    "has_next_page": false
  }
}
```

## Contoh detail sources

```http
GET /adult/contoh-video/sources?type=indonesia
```

Response:

```json
{
  "status": "success",
  "data": [
    { "url": "https://...", "quality": "HD", "label": "Source 1" }
  ],
  "cache": { "cached": false },
  "meta": {
    "category": "adult",
    "type": "indonesia",
    "source": "igodesu",
    "failover": false
  }
}
```

## Paksa satu source adult

```http
GET /adult/latest?type=west&source=ixxx
GET /adult/latest?type=indonesia&source=igodesu
```

Jika `source` diisi, response bukan merged.

---

# 11. Entertainment API

Prefix:

```http
/api/v1/entertainment
```

Ini convenience endpoint untuk gabungan kategori:

- `category=movie`
- `category=adult`
- `category=semi`

Untuk integrasi baru, disarankan tetap pakai endpoint spesifik `/movie` atau `/adult`. Pakai entertainment jika butuh feed gabungan/legacy.

## Endpoints

```http
GET /entertainment/latest?category=movie&page=1
GET /entertainment/popular?category=semi&page=1
GET /entertainment/search?q=keyword&category=adult&page=1
GET /entertainment/genres?category=movie
GET /entertainment/{id}?category=movie
GET /entertainment/{id}/sources?category=movie
```

## Contoh semi feed

```bash
curl -H "X-API-Key: gp_xxx" \
  "https://api.godenpg.dev/api/v1/entertainment/latest?category=semi&page=1"
```

Response:

```json
{
  "status": "success",
  "data": [
    {
      "title": "Semi Movie",
      "slug": "semi-movie",
      "thumbnail": "https://...",
      "category": "movie",
      "source": "lk21"
    }
  ],
  "cache": { "cached": false, "ttl": 900 },
  "meta": {
    "category": "semi",
    "source": "lk21",
    "failover": false,
    "page": 1,
    "total": 1,
    "has_next_page": false
  }
}
```

---

# 12. Vault API

Prefix:

```http
/api/v1/vault
```

Vault dipakai untuk konten cached siap stream. Flow:

1. Client resolve metadata/content.
2. API mengembalikan `stream_url` bertanda tangan.
3. Client pasang `stream_url` ke `<video>`, `<img>`, atau reader.
4. `stream_url` tidak butuh API key karena token sudah jadi authorization.

## Resolve by category + slug

```http
GET /vault/resolve?category=anime&slug=naruto-shippuden&kind=video
GET /vault/resolve?category=comic&slug=solo-leveling&kind=comic
GET /vault/resolve?category=adult-west&slug=contoh-video&kind=video
```

## Resolve by code

```http
GET /vault/resolve?code=anime:naruto-shippuden&kind=video
```

## Resolve by title

```http
GET /vault/resolve?title=Naruto%20Shippuden&kind=video
```

## Query params

| Param | Required | Arti |
| --- | --- | --- |
| `code` | optional | Content code preferred |
| `title` | optional | Fallback lookup by title |
| `category` + `slug` | optional | Build code otomatis |
| `kind` | optional | `video`, `comic`, `image` |
| `ttl` | optional | Stream URL lifetime, 60s - 21600s, default 3600 |

Minimal harus ada salah satu:

- `code`
- `title`
- `category + slug`

## Resolve response ready

```json
{
  "state": "ready",
  "data": {
    "id": "content_123",
    "title": "Naruto Shippuden",
    "status": "ready",
    "thumbnail": {
      "artifact_id": "thumb_1",
      "stream_url": "/api/v1/vault/stream/<token>"
    },
    "files": [
      {
        "artifact_id": "file_1",
        "kind": "video",
        "quality": "720p",
        "stream_url": "/api/v1/vault/stream/<token>"
      }
    ]
  }
}
```

## Resolve response scraping

```json
{
  "state": "scraping",
  "data": {
    "status": "scraping",
    "content_id": "content_123"
  }
}
```

## Stream endpoint

```http
GET /vault/stream/{token}
```

No API key. Token expiring. Mendukung `Range` header untuk video seek.

Contoh HTML:

```html
<video controls src="https://api.godenpg.dev/api/v1/vault/stream/<token>"></video>
```

---

# 13. Extra Generic API

Prefix:

```http
/api/v1/extra/{genre}
```

Untuk scraper registry tambahan yang overlap dengan endpoint utama. Biasanya tidak perlu dipakai user karena endpoint utama sudah lebih stabil.

Format:

```http
GET /extra/anime/latest?page=1
GET /extra/anime/search?q=naruto&page=1
GET /extra/anime/{slug}
GET /extra/comic/latest?page=1
GET /extra/movie/latest?page=1
```

Generic non-overlap juga bisa ada langsung:

```http
GET /adult-west/latest?page=1
GET /adult-id/latest?page=1
```

Namun untuk adult user integration, pakai:

```http
GET /adult/latest?type=west
GET /adult/latest?type=indonesia
```

---

# 14. Integration flow rekomendasi

## Video content flow

1. List feed:

```http
GET /movie/latest?page=1
```

2. Detail:

```http
GET /movie/{slug}
```

3. Playback source:

```http
GET /movie/{slug}/sources
```

4. Jika item `in_vault=true`, resolve Vault:

```http
GET /vault/resolve?category=movie&slug={slug}&kind=video
```

5. Render `stream_url` dari Vault jika tersedia.

## Comic reader flow

1. List:

```http
GET /comic/latest?type=manhwa&page=1
```

2. Detail:

```http
GET /comic/{comic_slug}?type=manhwa
```

3. Chapters:

```http
GET /comic/{comic_slug}/chapters?type=manhwa
```

4. Images:

```http
GET /comic/chapter/{chapter_slug}/images?type=manhwa
```

## Adult integrated flow

1. West feed:

```http
GET /adult/latest?type=west&page=1
```

2. Indonesia feed:

```http
GET /adult/latest?type=indonesia&page=1
```

3. Detail:

```http
GET /adult/{slug}?type=west
```

4. Sources:

```http
GET /adult/{slug}/sources?type=west
```

---

# 15. JavaScript client contoh

```ts
const BASE_URL = 'https://api.godenpg.dev/api/v1';
const API_KEY = process.env.GODENPG_API_KEY!;

type Category = 'anime' | 'donghua' | 'comic' | 'movie' | 'adult';

async function apiGet(path: string, params: Record<string, string | number | undefined> = {}) {
  const url = new URL(`${BASE_URL}${path}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) url.searchParams.set(key, String(value));
  });

  const res = await fetch(url, {
    headers: {
      'X-API-Key': API_KEY,
      'Accept': 'application/json',
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GODENPG API ${res.status}: ${body}`);
  }

  return res.json();
}

export function latestAnime(page = 1) {
  return apiGet('/anime/latest', { page });
}

export function searchComic(q: string, type = 'manhwa', page = 1) {
  return apiGet('/comic/search', { q, type, page });
}

export function latestAdult(type: 'west' | 'indonesia', page = 1) {
  return apiGet('/adult/latest', { type, page });
}

export function resolveVault(category: string, slug: string, kind: 'video' | 'comic' | 'image') {
  return apiGet('/vault/resolve', { category, slug, kind });
}
```

## Penting untuk frontend browser

Jangan expose API key di client-side public bundle. Panggil GODENPG API dari server route/backend sendiri, lalu frontend konsumsi endpoint milik app kamu.

---

# 16. Cache TTL

| Endpoint type | TTL |
| --- | --- |
| latest | 900 detik |
| popular | 900 detik |
| search | 1800 detik |
| detail/source/chapter | 3600 detik |
| Vault stream URL | default 3600 detik, max 21600 detik |

---

# 17. Catatan kategori nonaktif

`/api/v1/drama` atau `/api/v1/dracin` tidak dimount di live app saat dokumen ini dibuat. Jangan pakai untuk integrasi user sampai router diaktifkan lagi.
