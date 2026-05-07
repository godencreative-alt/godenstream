export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:px-6">
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.35em] text-[var(--dc-gold)]">
        Legal
      </p>
      <h1
        className="mb-8 text-3xl font-bold text-white"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Syarat dan Ketentuan
      </h1>
      <div className="space-y-6 text-sm leading-7 text-white/60">
        <p>Terakhir diperbarui: Mei 2026</p>
        <section>
          <h2 className="mb-2 text-lg font-semibold text-white">Penerimaan</h2>
          <p>
            Dengan mengakses DramaShort, pengguna setuju untuk menggunakan
            layanan ini secara wajar dan mematuhi ketentuan yang berlaku.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold text-white">Layanan</h2>
          <p>
            DramaShort menampilkan katalog drama pendek dari platform resmi
            captain.sapimu.au melalui integrasi pihak ketiga.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold text-white">Konten</h2>
          <p>
            Hak cipta konten tetap dimiliki oleh pemilik atau penyedia konten
            masing-masing. DramaShort tidak mengklaim kepemilikan atas konten
            pihak ketiga.
          </p>
        </section>
      </div>
    </div>
  );
}
