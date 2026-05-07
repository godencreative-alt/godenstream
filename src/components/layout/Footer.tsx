import Link from "next/link";
import { PlayCircleIcon } from "@heroicons/react/24/outline";

const columns = [
  {
    title: "Content",
    links: [
      { href: "/drama", label: "Short Drama" },
      { href: "/anime", label: "Anime" },
      { href: "/moviebox", label: "MovieBox" },
      { href: "/iqiyi", label: "iQIYI" },
      { href: "/wetv", label: "WeTV" },
    ],
  },
  {
    title: "Browse",
    links: [
      { href: "/drama/browse", label: "Drama Catalog" },
      { href: "/anime/browse", label: "Anime Catalog" },
      { href: "/drama/popular", label: "Popular" },
      { href: "/drama/a-z", label: "A-Z Index" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/pricing", label: "Pricing" },
      { href: "/drama/bookmarks", label: "Bookmarks" },
      { href: "/drama/history", label: "Watch History" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/terms", label: "Terms of Service" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.06] bg-[var(--dc-base)]">
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
          {/* Brand */}
          <div className="col-span-2 md:col-span-4 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <PlayCircleIcon className="h-6 w-6 text-[var(--dc-gold)]" />
              <span className="text-sm font-bold text-white">GodenStream</span>
            </Link>
            <p className="mt-3 text-[12px] leading-relaxed text-white/30">
              Multi-provider streaming platform with 5 content universes.
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-white/30">
                {col.title}
              </p>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-[13px] text-white/45 transition-colors hover:text-white/70"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t border-white/[0.06] pt-6 text-center text-[11px] text-white/20">
          GodenStream. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
