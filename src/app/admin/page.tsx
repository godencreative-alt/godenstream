import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getAdminSettings, getDashboardStats, verifyAdminSession } from "@/lib/admin/store";
import { getCacheStats } from "@/lib/admin/cache";
import { saveAdminSettings } from "./actions";

function statLabel(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const cookieStore = await cookies();
  if (!verifyAdminSession(cookieStore.get("dramashort_admin")?.value)) {
    redirect("/admin/login");
  }

  const [{ status }, settings, stats, cache] = await Promise.all([
    searchParams,
    getAdminSettings(),
    getDashboardStats(),
    getCacheStats(),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--dc-gold)]">
            Admin Dashboard
          </p>
          <h1 className="mt-2 text-3xl font-bold text-white">{settings.whitelabel.siteName}</h1>
          <p className="mt-2 text-sm text-white/45">
            Whitelabel, analytics, ads, SEO, cache, dan security settings.
          </p>
        </div>
        <form action="/api/admin/logout" method="post">
          <button className="rounded-xl border border-white/[0.08] px-4 py-2 text-sm text-white/60 hover:text-white">
            Logout
          </button>
        </form>
      </div>

      {status === "saved" ? (
        <div className="mb-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-200">
          Settings tersimpan.
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        {[
          ["Visitor hari ini", stats.visitorsToday],
          ["Visitor 7 hari", stats.visitorsSevenDays],
          ["Visitor bulan ini", stats.visitorsMonth],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5">
            <p className="text-xs uppercase tracking-widest text-white/30">{label}</p>
            <p className="mt-2 text-3xl font-bold text-white">{statLabel(Number(value))}</p>
          </div>
        ))}
      </div>

      <section className="mt-8 rounded-3xl border border-white/[0.06] bg-white/[0.03] p-5">
        <h2 className="text-xl font-bold text-white">Top 20 drama ditonton</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="text-xs uppercase tracking-widest text-white/30">
              <tr>
                <th className="py-3">Drama</th>
                <th>Platform</th>
                <th>Watch</th>
                <th>Terakhir</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {stats.topWatched.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-white/35">
                    Belum ada data watch.
                  </td>
                </tr>
              ) : (
                stats.topWatched.map((item) => (
                  <tr key={item.key}>
                    <td className="py-3">
                      <Link href={item.href} className="font-semibold text-white hover:text-[var(--dc-gold)]">
                        {item.title}
                      </Link>
                    </td>
                    <td className="text-white/50">{item.providerName}</td>
                    <td className="font-bold text-white">{statLabel(item.count)}</td>
                    <td className="text-white/35">{new Date(item.lastWatchedAt).toLocaleString("id-ID")}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <form action={saveAdminSettings} className="mt-8 grid gap-6 lg:grid-cols-2">
        <Panel title="Brand whitelabel">
          <TextInput name="siteName" label="Nama website" defaultValue={settings.whitelabel.siteName} />
          <TextInput name="siteTagline" label="Tagline" defaultValue={settings.whitelabel.siteTagline} />
          <TextInput name="logoUrl" label="Logo URL header/footer" defaultValue={settings.whitelabel.logoUrl} />
          <TextInput name="faviconUrl" label="Favicon URL" defaultValue={settings.whitelabel.faviconUrl} />
          <TextInput name="footerText" label="Footer copyright" defaultValue={settings.whitelabel.footerText} />
          <TextArea name="footerHtml" label="Footer text" defaultValue={settings.whitelabel.footerHtml} />
        </Panel>

        <Panel title="SEO">
          <TextInput name="seoTitle" label="Meta title" defaultValue={settings.seo.title} />
          <TextInput name="seoTitleTemplate" label="Title template" defaultValue={settings.seo.titleTemplate} />
          <TextArea name="seoDescription" label="Meta description" defaultValue={settings.seo.description} />
          <TextInput name="seoKeywords" label="Keywords" defaultValue={settings.seo.keywords} />
          <TextInput name="ogImageUrl" label="OpenGraph image URL" defaultValue={settings.seo.ogImageUrl} />
        </Panel>

        <Panel title="Carousel trending">
          <CheckInput name="carouselEnabled" label="Aktifkan carousel" defaultChecked={settings.carousel.enabled} />
          <TextInput name="carouselTitle" label="Judul carousel" defaultValue={settings.carousel.title} />
          <NumberInput name="carouselItemCount" label="Jumlah cover" defaultValue={settings.carousel.itemCount} min={5} max={60} />
          <NumberInput name="carouselSpeedSeconds" label="Durasi scroll detik" defaultValue={settings.carousel.speedSeconds} min={12} max={180} />
        </Panel>

        <Panel title="Ads & anti-adblock">
          <TextArea name="headScript" label="Ad script header/body safe loader" defaultValue={settings.ads.headScript} rows={5} />
          <TextArea name="bodyScript" label="Ad placement script" defaultValue={settings.ads.bodyScript} rows={5} />
          <CheckInput name="antiAdblockEnabled" label="Aktifkan anti-adblock" defaultChecked={settings.ads.antiAdblockEnabled} />
          <TextInput name="antiAdblockMessage" label="Pesan anti-adblock" defaultValue={settings.ads.antiAdblockMessage} />
          <TextArea name="antiAdblockScript" label="Script tambahan anti-adblock" defaultValue={settings.ads.antiAdblockScript} rows={4} />
        </Panel>

        <Panel title="Cache video/gambar">
          <CheckInput name="cacheEnabled" label="Aktifkan cache media" defaultChecked={settings.cache.enabled} />
          <CheckInput name="localCacheEnabled" label="Cache lokal" defaultChecked={settings.cache.localEnabled} />
          <NumberInput name="localMaxGb" label="Maksimum lokal GB (max 10)" defaultValue={settings.cache.localMaxBytes / 1024 / 1024 / 1024} min={1} max={10} />
          <NumberInput name="retentionDays" label="Retention hari" defaultValue={settings.cache.retentionDays} min={1} max={90} />
          <CheckInput name="r2Enabled" label="Upload cache ke Cloudflare R2" defaultChecked={settings.cache.r2Enabled} />
          <TextInput name="r2PublicBaseUrl" label="R2 public base URL" defaultValue={settings.cache.r2PublicBaseUrl} />
          <p className="text-xs text-white/35">
            Usage lokal: {statLabel(Math.round(cache.usageBytes / 1024 / 1024))} MB / {statLabel(Math.round(cache.maxBytes / 1024 / 1024 / 1024))} GB.
          </p>
        </Panel>

        <Panel title="Cloudflare anti-DDoS">
          <CheckInput name="securityHeadersEnabled" label="Security headers aktif" defaultChecked={settings.cloudflare.securityHeadersEnabled} />
          <CheckInput name="ddosProtectionEnabled" label="Tandai Cloudflare DDoS aktif" defaultChecked={settings.cloudflare.ddosProtectionEnabled} />
          <label className="block text-sm text-white/60">
            Challenge mode
            <select name="challengeMode" defaultValue={settings.cloudflare.challengeMode} className="mt-2 w-full rounded-xl border border-white/[0.08] bg-black/30 px-3 py-2 text-white">
              {["off", "essentially_off", "low", "medium", "high", "under_attack"].map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </label>
          <TextArea name="cloudflareNotes" label="Catatan Cloudflare" defaultValue={settings.cloudflare.notes} />
          <p className="text-xs leading-5 text-white/35">
            Untuk apply otomatis, set env `CLOUDFLARE_ZONE_ID` dan `CLOUDFLARE_API_TOKEN`, lalu POST ke
            `/api/admin/cloudflare/apply` saat login admin. Tanpa env ini, gunakan notes deploy untuk setup manual.
          </p>
        </Panel>

        <Panel title="Admin account">
          <TextInput name="adminUsername" label="Username admin" defaultValue={settings.admin.username} />
          <TextInput name="adminPassword" label="Password baru (kosongkan jika tidak diganti)" type="password" defaultValue="" />
        </Panel>

        <div className="lg:col-span-2">
          <button className="w-full rounded-2xl bg-[var(--dc-gold)] px-5 py-4 text-sm font-bold text-black">
            Simpan semua settings
          </button>
        </div>
      </form>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 rounded-3xl border border-white/[0.06] bg-white/[0.03] p-5">
      <h2 className="text-xl font-bold text-white">{title}</h2>
      {children}
    </section>
  );
}

function TextInput({
  name,
  label,
  defaultValue,
  type = "text",
}: {
  name: string;
  label: string;
  defaultValue: string | number;
  type?: string;
}) {
  return (
    <label className="block text-sm text-white/60">
      {label}
      <input name={name} type={type} defaultValue={defaultValue} className="mt-2 w-full rounded-xl border border-white/[0.08] bg-black/30 px-3 py-2 text-white outline-none focus:border-[var(--dc-gold)]" />
    </label>
  );
}

function NumberInput({
  name,
  label,
  defaultValue,
  min,
  max,
}: {
  name: string;
  label: string;
  defaultValue: number;
  min: number;
  max: number;
}) {
  return (
    <label className="block text-sm text-white/60">
      {label}
      <input name={name} type="number" min={min} max={max} defaultValue={defaultValue} className="mt-2 w-full rounded-xl border border-white/[0.08] bg-black/30 px-3 py-2 text-white outline-none focus:border-[var(--dc-gold)]" />
    </label>
  );
}

function TextArea({
  name,
  label,
  defaultValue,
  rows = 3,
}: {
  name: string;
  label: string;
  defaultValue: string;
  rows?: number;
}) {
  return (
    <label className="block text-sm text-white/60">
      {label}
      <textarea name={name} rows={rows} defaultValue={defaultValue} className="mt-2 w-full rounded-xl border border-white/[0.08] bg-black/30 px-3 py-2 text-white outline-none focus:border-[var(--dc-gold)]" />
    </label>
  );
}

function CheckInput({
  name,
  label,
  defaultChecked,
}: {
  name: string;
  label: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="flex items-center gap-3 text-sm text-white/60">
      <input name={name} type="checkbox" defaultChecked={defaultChecked} className="h-4 w-4 accent-[var(--dc-gold)]" />
      {label}
    </label>
  );
}
