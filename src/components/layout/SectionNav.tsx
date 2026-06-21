"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const sections = [
  { href: "/", label: "Home" },
  { href: "/anime/browse", label: "Anime" },
  { href: "/donghua/browse", label: "Donghua" },
  { href: "/moviebox/browse", label: "Movie" },
  { href: "/comic/browse", label: "Comic" },
  { href: "/entertainment/browse", label: "Entertainment" },
];

export default function SectionNav() {
  const pathname = usePathname();

  return (
    <div className="border-b border-white/[0.06] bg-[var(--dc-base)]/95 backdrop-blur-md">
      <div className="no-scrollbar mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-4 py-2 md:px-6">
        {sections.map(({ href, label }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`shrink-0 rounded-full px-3 py-1.5 text-[12px] font-semibold ${
                active
                  ? "bg-[var(--dc-gold)]/15 text-[var(--dc-gold)]"
                  : "text-white/45 hover:text-white/70"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
