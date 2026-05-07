export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:px-6">
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.35em] text-[var(--dc-gold)]">
        DramaShort
      </p>
      <h1
        className="mb-8 text-3xl font-bold text-white"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Tentang
      </h1>
      <div className="space-y-6 text-sm leading-7 text-white/60">
        <p>
          DramaShort adalah antarmuka streaming yang berfokus pada drama pendek
          dari platform Drama-ID, DramaBox, Melolo, NetShort, dan DramaNova.
        </p>
        <p>
          Halaman awal menampilkan section per platform dengan akses cepat ke
          daftar Trending, Popular, Terbaru, dan halaman platform masing-masing.
        </p>
        <p>
          Tujuan DramaShort adalah memudahkan pengguna menemukan shordrama dari
          beberapa provider dalam satu pengalaman yang ringan dan mudah
          digunakan.
        </p>
      </div>
    </div>
  );
}
