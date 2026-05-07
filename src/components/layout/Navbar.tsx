"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  PlayIcon,
  SparklesIcon,
  FilmIcon,
  TvIcon,
  PlayCircleIcon,
  ChevronDownIcon,
  Bars3Icon,
  XMarkIcon,
  MagnifyingGlassIcon,
  HomeIcon,
  UserCircleIcon,
  ArrowRightStartOnRectangleIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/outline";
import { useAuthStore } from "@/store/auth";

type MenuKey = "drama" | "anime" | "moviebox" | "iqiyi" | "wetv";

const sectionColors: Record<
  MenuKey,
  { text: string; bg: string; glow: string }
> = {
  drama: {
    text: "text-[var(--dc-gold)]",
    bg: "bg-[var(--dc-gold)]/10",
    glow: "via-[var(--dc-gold)]/40",
  },
  anime: {
    text: "text-[var(--dc-violet)]",
    bg: "bg-[var(--dc-violet)]/10",
    glow: "via-[var(--dc-violet)]/40",
  },
  moviebox: {
    text: "text-[var(--dc-orange)]",
    bg: "bg-[var(--dc-orange)]/10",
    glow: "via-[var(--dc-orange)]/40",
  },
  iqiyi: {
    text: "text-[var(--dc-cyan)]",
    bg: "bg-[var(--dc-cyan)]/10",
    glow: "via-[var(--dc-cyan)]/40",
  },
  wetv: {
    text: "text-[var(--dc-rose)]",
    bg: "bg-[var(--dc-rose)]/10",
    glow: "via-[var(--dc-rose)]/40",
  },
};

const dramaLinks = [
  { href: "/drama", label: "Drama Home", desc: "Featured & popular", dot: "bg-[var(--dc-gold)]" },
  { href: "/drama/browse", label: "Browse All", desc: "Full catalog", dot: "bg-emerald-400" },
  { href: "/drama/popular", label: "Popular", desc: "Most watched", dot: "bg-amber-400" },
  { href: "/drama/search", label: "Search", desc: "Find dramas", dot: "bg-white/20" },
];

const animeLinks = [
  { href: "/anime", label: "Anime Home", desc: "Featured & popular", dot: "bg-[var(--dc-violet)]" },
  { href: "/anime/browse", label: "Browse All", desc: "Full catalog", dot: "bg-emerald-400" },
  { href: "/anime/popular", label: "Popular", desc: "Most watched", dot: "bg-amber-400" },
  { href: "/anime/search", label: "Search", desc: "Find anime", dot: "bg-white/20" },
];

const movieboxLinks = [
  { href: "/moviebox", label: "MovieBox Home", desc: "Movies & Series", dot: "bg-[var(--dc-orange)]" },
  { href: "/moviebox/browse", label: "Browse All", desc: "Full catalog", dot: "bg-emerald-400" },
  { href: "/moviebox/popular", label: "Popular", desc: "Most watched", dot: "bg-amber-400" },
  { href: "/moviebox/search", label: "Search", desc: "Find content", dot: "bg-white/20" },
];

const iqiyiLinks = [
  { href: "/iqiyi", label: "iQIYI Home", desc: "Chinese streaming", dot: "bg-[var(--dc-cyan)]" },
  { href: "/iqiyi/browse", label: "Browse All", desc: "Full catalog", dot: "bg-emerald-400" },
  { href: "/iqiyi/popular", label: "Popular", desc: "Most watched", dot: "bg-amber-400" },
  { href: "/iqiyi/search", label: "Search", desc: "Find content", dot: "bg-white/20" },
];

const wetvLinks = [
  { href: "/wetv", label: "WeTV Home", desc: "Asian streaming", dot: "bg-[var(--dc-rose)]" },
  { href: "/wetv/browse", label: "Browse All", desc: "Full catalog", dot: "bg-emerald-400" },
  { href: "/wetv/popular", label: "Popular", desc: "Most watched", dot: "bg-amber-400" },
  { href: "/wetv/search", label: "Search", desc: "Find content", dot: "bg-white/20" },
];

const menuLinksMap: Record<MenuKey, typeof dramaLinks> = {
  drama: dramaLinks,
  anime: animeLinks,
  moviebox: movieboxLinks,
  iqiyi: iqiyiLinks,
  wetv: wetvLinks,
};

const dramaGenres = ["Romance", "CEO", "Action", "Comedy", "Fantasy", "Revenge"];
const animeGenres = ["Action", "Romance", "Fantasy", "Isekai", "Shounen", "Slice of Life"];
const movieboxGenres = ["Action", "Thriller", "Horror", "Sci-Fi", "Drama", "Comedy"];
const genreMap: Record<MenuKey, string[]> = {
  drama: dramaGenres,
  anime: animeGenres,
  moviebox: movieboxGenres,
  iqiyi: ["Romance", "Fantasy", "Action", "Historical", "Modern"],
  wetv: ["Romance", "Fantasy", "Action", "Historical", "Idol"],
};

const sectionLabels: Record<MenuKey, string> = {
  drama: "Short Drama",
  anime: "Anime",
  moviebox: "MovieBox",
  iqiyi: "iQIYI",
  wetv: "WeTV",
};

function MegaMenu({
  headerColor,
  headerLabel,
  links,
  genres,
  genreTo,
  viewAllTo,
  onClose,
}: {
  headerColor: string;
  headerLabel: string;
  links: typeof dramaLinks;
  genres: string[];
  genreTo: (g: string) => string;
  viewAllTo: string;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      className="absolute left-0 top-full z-50 mt-2 w-[480px] rounded-2xl border border-white/[0.08] bg-[#0e0e0e]/98 shadow-2xl backdrop-blur-2xl"
    >
      <div className="grid grid-cols-2 gap-0">
        <div className="border-r border-white/[0.06] p-3">
          <p
            className={`mb-2 text-[9px] font-bold uppercase tracking-widest ${headerColor}`}
          >
            {headerLabel}
          </p>
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={onClose}
              className="flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] hover:bg-white/[0.05]"
            >
              <span className={`h-1.5 w-1.5 rounded-full ${link.dot}`} />
              <div>
                <span className="font-medium text-white/80">{link.label}</span>
                <span className="ml-2 text-[11px] text-white/30">
                  {link.desc}
                </span>
              </div>
            </Link>
          ))}
        </div>
        <div className="p-3">
          <p className="mb-2 text-[9px] font-bold uppercase tracking-widest text-white/30">
            Genres
          </p>
          <div className="flex flex-wrap gap-1.5">
            {genres.map((genre) => (
              <Link
                key={genre}
                href={genreTo(genre)}
                onClick={onClose}
                className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-2.5 py-1 text-[11px] text-white/50 hover:bg-white/[0.07] hover:text-white"
              >
                {genre}
              </Link>
            ))}
          </div>
          <Link
            href={viewAllTo}
            onClick={onClose}
            className="mt-3 block text-[11px] font-medium text-white/40 hover:text-white"
          >
            View All →
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const navRef = useRef<HTMLElement>(null);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const [openMenu, setOpenMenu] = useState<MenuKey | null>(null);
  const [universeOpen, setUniverseOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const isDramaActive = pathname === "/drama" || pathname.startsWith("/drama/");
  const isAnimeActive = pathname === "/anime" || pathname.startsWith("/anime/");
  const isMBActive = pathname === "/moviebox" || pathname.startsWith("/moviebox/");
  const isIqiyiActive = pathname === "/iqiyi" || pathname.startsWith("/iqiyi/");
  const isWetvActive = pathname === "/wetv" || pathname.startsWith("/wetv/");

  const activeUniverse: MenuKey = isDramaActive
    ? "drama"
    : isAnimeActive
      ? "anime"
      : isMBActive
        ? "moviebox"
        : isIqiyiActive
          ? "iqiyi"
          : isWetvActive
            ? "wetv"
            : "drama";

  const activeColors = sectionColors[activeUniverse];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
        setUniverseOpen(false);
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setOpenMenu(null);
    setUniverseOpen(false);
    setMobileOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

  const universeItems = [
    { key: "drama" as const, icon: <PlayIcon className="h-4 w-4" />, label: "Short Drama", href: "/drama", active: isDramaActive },
    { key: "anime" as const, icon: <SparklesIcon className="h-4 w-4" />, label: "Anime", href: "/anime", active: isAnimeActive },
    { key: "moviebox" as const, icon: <FilmIcon className="h-4 w-4" />, label: "MovieBox", href: "/moviebox", active: isMBActive },
    { key: "iqiyi" as const, icon: <TvIcon className="h-4 w-4" />, label: "iQIYI", href: "/iqiyi", active: isIqiyiActive },
    { key: "wetv" as const, icon: <PlayCircleIcon className="h-4 w-4" />, label: "WeTV", href: "/wetv", active: isWetvActive },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-[rgba(255,255,255,0.07)]">
      <div className="absolute inset-0 bg-[rgba(8,8,8,0.88)] backdrop-blur-2xl" />
      <div
        className={`absolute inset-x-0 top-0 h-px transition-colors duration-500 bg-gradient-to-r from-transparent ${activeColors.glow} to-transparent`}
      />

      <nav
        ref={navRef}
        className="relative mx-auto flex max-w-7xl items-center justify-between gap-2 px-4 py-2.5 md:px-6"
      >
        {/* Left: Logo + Universe Switcher */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <PlayCircleIcon className={`h-6 w-6 ${activeColors.text}`} />
            <span className="hidden text-sm font-bold text-white sm:block">
              GodenStream
            </span>
          </Link>

          <div className="relative">
            <button
              onClick={() => setUniverseOpen(!universeOpen)}
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold bg-white/[0.04] hover:bg-white/[0.07]"
            >
              <span className={activeColors.text}>
                {universeItems.find((u) => u.key === activeUniverse)?.icon}
              </span>
              <span className="hidden text-white/80 md:block">
                {sectionLabels[activeUniverse]}
              </span>
              <ChevronDownIcon
                className={`h-3.5 w-3.5 text-white/40 transition-transform ${universeOpen ? "rotate-180" : ""}`}
              />
            </button>

            <AnimatePresence>
              {universeOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="absolute left-0 top-full z-50 mt-2 w-48 rounded-2xl border border-white/[0.08] bg-[#0e0e0e]/98 shadow-2xl backdrop-blur-2xl"
                >
                  {universeItems.map((u) => (
                    <button
                      key={u.key}
                      onClick={() => {
                        router.push(u.href);
                        setUniverseOpen(false);
                      }}
                      className={`flex w-full items-center gap-3 px-4 py-2.5 text-[13px] first:rounded-t-2xl last:rounded-b-2xl ${
                        u.active
                          ? `${sectionColors[u.key].bg} ${sectionColors[u.key].text}`
                          : "text-white/65 hover:bg-white/[0.05]"
                      }`}
                    >
                      {u.icon}
                      <span className="font-medium">{u.label}</span>
                      {(u.key === "iqiyi" || u.key === "wetv") && !u.active && (
                        <span className="ml-auto rounded border border-[var(--dc-violet)]/30 bg-[var(--dc-violet)]/10 px-1 text-[8px] font-bold text-[var(--dc-violet)]">
                          PRO
                        </span>
                      )}
                      {u.active && (
                        <span className="ml-auto text-[9px] font-bold uppercase opacity-50">
                          Now
                        </span>
                      )}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Center: Desktop section links */}
        <div className="hidden items-center gap-1 lg:flex">
          {(["drama", "anime", "moviebox", "iqiyi", "wetv"] as const).map(
            (key) => (
              <div key={key} className="relative">
                <button
                  onMouseEnter={() => setOpenMenu(key)}
                  onClick={() =>
                    setOpenMenu(openMenu === key ? null : key)
                  }
                  className={`rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors ${
                    pathname.startsWith(`/${key}`)
                      ? `${sectionColors[key].bg} ${sectionColors[key].text}`
                      : "text-white/50 hover:text-white/70"
                  }`}
                >
                  {sectionLabels[key]}
                </button>
                <AnimatePresence>
                  {openMenu === key && (
                    <MegaMenu
                      headerColor={sectionColors[key].text}
                      headerLabel={sectionLabels[key]}
                      links={menuLinksMap[key]}
                      genres={genreMap[key]}
                      genreTo={(g) =>
                        `/${key}/browse?tag=${encodeURIComponent(g)}`
                      }
                      viewAllTo={`/${key}/browse`}
                      onClose={() => setOpenMenu(null)}
                    />
                  )}
                </AnimatePresence>
              </div>
            ),
          )}
        </div>

        {/* Right: Search + User + Mobile */}
        <div className="flex items-center gap-2">
          <Link
            href={`/${activeUniverse}/search`}
            className="rounded-lg p-2 text-white/50 hover:bg-white/[0.05] hover:text-white"
          >
            <MagnifyingGlassIcon className="h-5 w-5" />
          </Link>

          {/* User menu */}
          <div className="relative hidden md:block">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="rounded-lg p-2 text-white/50 hover:bg-white/[0.05] hover:text-white"
            >
              <UserCircleIcon className="h-5 w-5" />
            </button>
            <AnimatePresence>
              {userMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="absolute right-0 top-full z-50 mt-2 w-44 rounded-2xl border border-white/[0.08] bg-[#0e0e0e]/98 p-1 shadow-2xl backdrop-blur-2xl"
                >
                  {user ? (
                    <>
                      <div className="border-b border-white/[0.06] px-3 py-2">
                        <p className="text-[12px] font-medium text-white/80 truncate">
                          {user.name}
                        </p>
                        <p className="text-[10px] text-white/30 truncate">
                          {user.email}
                        </p>
                      </div>
                      <Link
                        href="/pricing"
                        className="flex items-center gap-2 rounded-xl px-3 py-2 text-[13px] text-white/60 hover:bg-white/[0.05]"
                      >
                        <CurrencyDollarIcon className="h-4 w-4" />
                        Pricing
                      </Link>
                      <button
                        onClick={() => {
                          logout();
                          setUserMenuOpen(false);
                        }}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-[13px] text-red-400 hover:bg-white/[0.05]"
                      >
                        <ArrowRightStartOnRectangleIcon className="h-4 w-4" />
                        Logout
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/pricing"
                        className="flex items-center gap-2 rounded-xl px-3 py-2 text-[13px] text-white/60 hover:bg-white/[0.05]"
                      >
                        <CurrencyDollarIcon className="h-4 w-4" />
                        Pricing
                      </Link>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-2 text-white/50 hover:bg-white/[0.05] lg:hidden"
          >
            <Bars3Icon className="h-5 w-5" />
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="absolute right-0 top-0 bottom-0 w-80 overflow-y-auto bg-[#0e0e0e] p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-6 flex items-center justify-between">
                <span className="text-sm font-bold text-white">Menu</span>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg p-1 text-white/50 hover:text-white"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <Link
                href="/"
                onClick={() => setMobileOpen(false)}
                className="mb-4 flex items-center gap-2 text-sm font-medium text-white/70 hover:text-white"
              >
                <HomeIcon className="h-4 w-4" /> Home
              </Link>

              <div className="space-y-6">
                {universeItems.map(({ key, label }) => (
                  <div key={key}>
                    <p
                      className={`mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest ${sectionColors[key].text}`}
                    >
                      {label}
                      {(key === "iqiyi" || key === "wetv") && (
                        <span className="rounded border border-[var(--dc-violet)]/30 bg-[var(--dc-violet)]/10 px-1 text-[8px] text-[var(--dc-violet)]">
                          PRO
                        </span>
                      )}
                    </p>
                    <div className="grid grid-cols-2 gap-1">
                      {menuLinksMap[key].map((l) => (
                        <Link
                          key={l.href}
                          href={l.href}
                          onClick={() => setMobileOpen(false)}
                          className={`rounded-xl px-3 py-2.5 text-[13px] font-medium ${
                            pathname.startsWith(l.href)
                              ? `${sectionColors[key].bg} ${sectionColors[key].text}`
                              : "text-white/60 hover:bg-white/[0.05]"
                          }`}
                        >
                          {l.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 border-t border-white/[0.06] pt-4">
                {user ? (
                  <div className="space-y-1">
                    <p className="text-[12px] font-medium text-white/80">
                      {user.name}
                    </p>
                    <Link
                      href="/pricing"
                      onClick={() => setMobileOpen(false)}
                      className="block rounded-xl px-3 py-2 text-[13px] text-white/60 hover:bg-white/[0.05]"
                    >
                      Pricing
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setMobileOpen(false);
                      }}
                      className="block w-full rounded-xl px-3 py-2 text-left text-[13px] text-red-400 hover:bg-white/[0.05]"
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <Link
                    href="/pricing"
                    onClick={() => setMobileOpen(false)}
                    className="block rounded-xl px-3 py-2 text-[13px] text-white/60 hover:bg-white/[0.05]"
                  >
                    Pricing
                  </Link>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
