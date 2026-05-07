"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Bars3Icon,
  ChevronDownIcon,
  FireIcon,
  MagnifyingGlassIcon,
  PlayCircleIcon,
  SparklesIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const navLinks = [
  { href: "/trending", label: "Trending", icon: FireIcon },
  { href: "/popular", label: "Popular", icon: SparklesIcon },
  { href: "/terbaru", label: "Terbaru", icon: PlayCircleIcon },
];

const moreLinks = [
  { href: "/syarat-dan-ketentuan", label: "Syarat dan Ketentuan" },
  { href: "/kebijakan-privasi", label: "Kebijakan Privasi" },
  { href: "/dmca", label: "DMCA" },
  { href: "/tentang", label: "Tentang" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [query, setQuery] = useState("");

  function submitSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = query.trim();
    if (q) router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[var(--dc-base)]/95 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--dc-gold)]/15">
            <PlayCircleIcon className="h-5 w-5 text-[var(--dc-gold)]" />
          </span>
          <span
            className="text-lg font-bold tracking-tight text-white"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Goden<span className="gradient-text-gold">Stream</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
                  active
                    ? "bg-[var(--dc-gold)]/15 text-[var(--dc-gold)]"
                    : "text-white/55 hover:bg-white/[0.04] hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}

          <div className="relative">
            <button
              type="button"
              onClick={() => setMoreOpen((open) => !open)}
              className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
                moreLinks.some((link) => pathname === link.href)
                  ? "bg-[var(--dc-gold)]/15 text-[var(--dc-gold)]"
                  : "text-white/55 hover:bg-white/[0.04] hover:text-white"
              }`}
            >
              Lainnya
              <ChevronDownIcon className={`h-4 w-4 transition-transform ${moreOpen ? "rotate-180" : ""}`} />
            </button>
            {moreOpen && (
              <div className="absolute left-0 top-full z-50 mt-2 w-56 rounded-2xl border border-white/[0.08] bg-[#0e0e0e]/98 p-2 shadow-2xl backdrop-blur-2xl">
                {moreLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMoreOpen(false)}
                    className={`block rounded-xl px-3 py-2 text-sm transition-colors ${
                      pathname === link.href
                        ? "bg-[var(--dc-gold)]/15 text-[var(--dc-gold)]"
                        : "text-white/60 hover:bg-white/[0.05] hover:text-white"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>

        <form onSubmit={submitSearch} className="ml-auto hidden max-w-xs flex-1 md:block">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari shordrama..."
              className="h-10 w-full rounded-xl border border-white/[0.06] bg-white/[0.03] pl-9 pr-3 text-sm text-white placeholder:text-white/25 focus:border-[var(--dc-gold)]/40 focus:outline-none"
            />
          </div>
        </form>

        <button
          type="button"
          onClick={() => setMobileOpen((open) => !open)}
          className="ml-auto rounded-xl p-2 text-white/70 hover:bg-white/[0.06] md:hidden"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-white/[0.06] px-4 py-3 md:hidden">
          <form onSubmit={submitSearch} className="mb-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari shordrama..."
              className="h-10 w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 text-sm text-white placeholder:text-white/25 focus:border-[var(--dc-gold)]/40 focus:outline-none"
            />
          </form>
          <nav className="grid gap-1">
            {[...navLinks, ...moreLinks.map((link) => ({ ...link, icon: ChevronDownIcon }))].map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold ${
                  pathname === href
                    ? "bg-[var(--dc-gold)]/15 text-[var(--dc-gold)]"
                    : "text-white/60"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
