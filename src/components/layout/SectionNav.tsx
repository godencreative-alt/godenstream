"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

function useInlineSearch<T extends { id: string | number; title?: string; name?: string }>(
  searchFn: (query: string) => Promise<{ data: T[] }>,
  delay = 300,
) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      abortRef.current = new AbortController();
      setLoading(true);
      try {
        const res = await searchFn(query);
        setResults(res.data.slice(0, 8));
        setOpen(true);
        setSelectedIdx(-1);
      } catch {
        // ignore aborted
      }
      setLoading(false);
    }, delay);

    return () => clearTimeout(timer);
  }, [query, searchFn, delay]);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIdx((i) => Math.min(i + 1, results.length - 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIdx((i) => Math.max(i - 1, 0));
    }
    if (e.key === "Escape") {
      setOpen(false);
      setQuery("");
    }
  }

  return { query, setQuery, results, loading, open, setOpen, selectedIdx, onKeyDown };
}

interface SectionNavConfig {
  links: { href: string; label: string }[];
  accentColor: string;
  accentBg: string;
  searchFn?: (query: string) => Promise<{ data: { id: string | number; title?: string; name?: string }[] }>;
  detailPath: string;
}

const SECTIONS: Record<string, SectionNavConfig> = {
  drama: {
    links: [
      { href: "/drama", label: "Home" },
      { href: "/drama/browse", label: "Browse" },
      { href: "/drama/popular", label: "Popular" },
      { href: "/drama/a-z", label: "A-Z" },
      { href: "/drama/bookmarks", label: "Saved" },
      { href: "/drama/history", label: "History" },
    ],
    accentColor: "text-[var(--dc-gold)]",
    accentBg: "bg-[var(--dc-gold)]/15",
    detailPath: "/drama",
  },
  anime: {
    links: [
      { href: "/anime", label: "Home" },
      { href: "/anime/browse", label: "Browse" },
      { href: "/anime/popular", label: "Popular" },
      { href: "/anime/a-z", label: "A-Z" },
      { href: "/anime/bookmarks", label: "Saved" },
      { href: "/anime/history", label: "History" },
    ],
    accentColor: "text-[var(--dc-violet)]",
    accentBg: "bg-[var(--dc-violet)]/15",
    detailPath: "/anime",
  },
  moviebox: {
    links: [
      { href: "/moviebox", label: "Home" },
      { href: "/moviebox/browse", label: "Browse" },
      { href: "/moviebox/popular", label: "Popular" },
      { href: "/moviebox/bookmarks", label: "Saved" },
      { href: "/moviebox/history", label: "History" },
    ],
    accentColor: "text-[var(--dc-orange)]",
    accentBg: "bg-[var(--dc-orange)]/15",
    detailPath: "/moviebox",
  },
  iqiyi: {
    links: [
      { href: "/iqiyi", label: "Home" },
      { href: "/iqiyi/browse", label: "Browse" },
      { href: "/iqiyi/popular", label: "Popular" },
      { href: "/iqiyi/bookmarks", label: "Saved" },
      { href: "/iqiyi/history", label: "History" },
    ],
    accentColor: "text-[var(--dc-cyan)]",
    accentBg: "bg-[var(--dc-cyan)]/15",
    detailPath: "/iqiyi",
  },
  wetv: {
    links: [
      { href: "/wetv", label: "Home" },
      { href: "/wetv/browse", label: "Browse" },
      { href: "/wetv/popular", label: "Popular" },
      { href: "/wetv/bookmarks", label: "Saved" },
      { href: "/wetv/history", label: "History" },
    ],
    accentColor: "text-[var(--dc-rose)]",
    accentBg: "bg-[var(--dc-rose)]/15",
    detailPath: "/wetv",
  },
};

function SectionNavInner({ config }: { config: SectionNavConfig }) {
  const pathname = usePathname();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <div className="border-b border-white/[0.06] bg-[var(--dc-base)]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center gap-1 px-4 md:px-6">
        <div className="no-scrollbar flex flex-1 items-center gap-0.5 overflow-x-auto py-2">
          {config.links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors ${
                pathname === link.href ||
                (link.href !== `/${link.href.split("/")[1]}` &&
                  pathname.startsWith(link.href))
                  ? `${config.accentBg} ${config.accentColor}`
                  : "text-white/45 hover:text-white/70"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="relative shrink-0">
          <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/30" />
          <input
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSearchOpen(e.target.value.length >= 2);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && searchQuery.length >= 2) {
                router.push(
                  `${config.detailPath}/search?q=${encodeURIComponent(searchQuery)}`,
                );
                setSearchOpen(false);
              }
              if (e.key === "Escape") {
                setSearchOpen(false);
                setSearchQuery("");
              }
            }}
            className="h-8 w-36 rounded-lg bg-white/[0.04] pl-8 pr-3 text-[12px] text-white placeholder:text-white/25 focus:bg-white/[0.07] focus:outline-none md:w-48"
            placeholder="Search..."
          />
        </div>
      </div>
    </div>
  );
}

export default function SectionNav() {
  const pathname = usePathname();

  for (const [key, config] of Object.entries(SECTIONS)) {
    if (pathname.startsWith(`/${key}`)) {
      return <SectionNavInner config={config} />;
    }
  }

  return null;
}
