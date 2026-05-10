# Changelog

## Unreleased

### Added

- Whitelabel admin dashboard at `/admin`.
- Configurable website name, tagline, header/footer logo, favicon, SEO metadata, footer text, carousel, ads, anti-adblock, cache, Cloudflare, and admin credentials.
- Front-page trending cover carousel with configurable item count and scroll speed.
- Visitor analytics for today, seven days, month, and Top 20 watched dramas.
- Local media cache with retention and 10GB maximum cap.
- Optional Cloudflare R2 media cache upload support.
- Cloudflare anti-DDoS apply endpoint for zone security settings when Cloudflare env vars are configured.

### Security

- Admin session uses HTTP-only cookies.
- Media cache endpoint validates allowed HTTPS media hosts before fetching remote files.
- Added Cloudflare/security deployment notes and env configuration.

## v1.0.0 - 2026-05-07

### Added

- Fokus ulang aplikasi menjadi DramaShort untuk platform shordrama.
- Homepage dengan platform resmi captain.sapimu.au.
- Navbar Trending, Popular, Terbaru, dan dropdown Lainnya.
- Halaman Syarat dan Ketentuan, Kebijakan Privasi, DMCA, dan Tentang.
- Halaman aggregate Trending/Popular/Terbaru dengan filter semua platform.
- Halaman platform lengkap dan halaman pencarian shordrama.
- Flow playback lengkap: card shordrama → detail drama → daftar episode → player episode.
- Video player dengan HLS, kualitas, subtitle, progress lokal, fullscreen, tombol kembali fullscreen, dropdown episode fullscreen, dan double-tap skip 10 detik.
- Proxy API server-side dengan allowlist path, timeout upstream, rate limit sederhana, dan header filtering.
- Dokumentasi deployment aaPanel dan cPanel.

### Changed

- Branding website dan owner dari GodenStream menjadi DramaShort.
- Platform homepage mengikuti daftar resmi captain.sapimu.au.
- Package metadata diubah menjadi `dramashort` versi `1.0.0`.
- Default browser API base diarahkan ke `/api/proxy` agar API key tidak diekspos di client.
- Ukuran video portrait kini fit terhadap tinggi viewport, bukan memenuhi halaman secara berlebihan.

### Fixed

- Card shordrama sebelumnya kembali ke listing platform; sekarang membuka detail drama yang benar.
- Duplicate React key pada card listing NetShort.
- Fallback video kosong agar API yang tidak mengirim URL video tidak memecahkan halaman player.
- Search navbar kini mengarah ke `/search?q=...`.

### Security

- Menghindari hard-code API key di source/documentation.
- Menambahkan catatan konfigurasi server-only `API_KEY`.
- Mempertahankan security headers di `next.config.ts`.
- Proxy membatasi prefix upstream yang boleh dipanggil.
