import Link from "next/link";

export default function DramaPage() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[var(--dc-gold)]">
        Drama
      </p>
      <h1
        className="text-3xl font-bold text-white md:text-4xl"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Drama sementara tidak tersedia
      </h1>
      <p className="max-w-xl text-sm leading-6 text-white/50">
        Endpoint <code>/api/v1/drama</code> belum aktif di API live. Pakai section lain dulu sambil menunggu router backend diaktifkan lagi.
      </p>
      <Link
        href="/"
        className="rounded-full bg-[var(--dc-gold)] px-4 py-2 text-sm font-bold text-black"
      >
        Kembali ke Home
      </Link>
    </div>
  );
}
