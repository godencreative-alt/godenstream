import { getPublicSettings } from "@/lib/admin/store";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ error }, settings] = await Promise.all([searchParams, getPublicSettings()]);

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-12">
      <form
        action="/api/admin/login"
        method="post"
        className="w-full rounded-3xl border border-white/[0.08] bg-white/[0.03] p-6 shadow-2xl"
      >
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--dc-gold)]">
          Admin Dashboard
        </p>
        <h1 className="mt-2 text-3xl font-bold text-white">{settings.whitelabel.siteName}</h1>
        <p className="mt-2 text-sm text-white/45">
          Masuk untuk mengatur whitelabel, SEO, ads, cache, dan analytics.
        </p>
        {error ? (
          <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">
            Username atau password salah.
          </div>
        ) : null}
        <label className="mt-6 block text-sm text-white/60">
          Username
          <input
            name="username"
            autoComplete="username"
            className="mt-2 w-full rounded-xl border border-white/[0.08] bg-black/30 px-3 py-2 text-white outline-none focus:border-[var(--dc-gold)]"
            required
          />
        </label>
        <label className="mt-4 block text-sm text-white/60">
          Password
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            className="mt-2 w-full rounded-xl border border-white/[0.08] bg-black/30 px-3 py-2 text-white outline-none focus:border-[var(--dc-gold)]"
            required
          />
        </label>
        <button className="mt-6 w-full rounded-xl bg-[var(--dc-gold)] px-4 py-3 text-sm font-bold text-black">
          Masuk
        </button>
        <p className="mt-4 text-xs leading-5 text-white/30">
          Default development login: admin / admin123. Ganti setelah login pertama.
        </p>
      </form>
    </div>
  );
}
