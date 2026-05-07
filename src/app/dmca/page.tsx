export default function DmcaPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:px-6">
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.35em] text-[var(--dc-gold)]">
        Legal
      </p>
      <h1
        className="mb-8 text-3xl font-bold text-white"
        style={{ fontFamily: "var(--font-display)" }}
      >
        DMCA
      </h1>
      <div className="space-y-6 text-sm leading-7 text-white/60">
        <section>
          <h2 className="mb-2 text-lg font-semibold text-white">
            Pengajuan Klaim
          </h2>
          <p>
            Pemilik hak cipta dapat mengajukan permintaan penghapusan konten
            dengan menyertakan identitas pemilik, bukti kepemilikan, URL konten,
            dan pernyataan bahwa penggunaan konten tidak diizinkan.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold text-white">
            Peninjauan
          </h2>
          <p>
            DramaShort akan meninjau laporan yang lengkap dan mengambil
            tindakan yang sesuai, termasuk membatasi akses ke konten yang
            dilaporkan bila diperlukan.
          </p>
        </section>
      </div>
    </div>
  );
}
