export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:px-6">
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.35em] text-[var(--dc-gold)]">
        Legal
      </p>
      <h1
        className="mb-8 text-3xl font-bold text-white"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Kebijakan Privasi
      </h1>
      <div className="space-y-6 text-sm leading-7 text-white/60">
        <p>Terakhir diperbarui: Mei 2026</p>
        <section>
          <h2 className="mb-2 text-lg font-semibold text-white">
            Informasi yang Diproses
          </h2>
          <p>
            DramaShort dapat menggunakan data penggunaan lokal seperti riwayat
            tontonan dan bookmark untuk meningkatkan pengalaman pengguna.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold text-white">
            Penyimpanan Lokal
          </h2>
          <p>
            Riwayat tontonan dan bookmark disimpan di perangkat pengguna melalui
            localStorage dan dapat dihapus melalui pengaturan browser.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold text-white">Kontak</h2>
          <p>
            Untuk pertanyaan privasi, hubungi tim DramaShort melalui kanal
            dukungan resmi.
          </p>
        </section>
      </div>
    </div>
  );
}
