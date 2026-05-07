"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SHORDRAMA_PLATFORMS } from "@/lib/api";

export default function SectionNav() {
  const pathname = usePathname();

  return (
    <div className="border-b border-white/[0.06] bg-[var(--dc-base)]/95 backdrop-blur-md">
      <div className="no-scrollbar mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-4 py-2 md:px-6">
        <Link
          href="/"
          className={`shrink-0 rounded-full px-3 py-1.5 text-[12px] font-semibold ${
            pathname === "/"
              ? "bg-[var(--dc-gold)]/15 text-[var(--dc-gold)]"
              : "text-white/45 hover:text-white/70"
          }`}
        >
          Semua Platform
        </Link>
        {SHORDRAMA_PLATFORMS.map((platform) => {
          const href = `/platform/${platform.slug}`;
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={platform.slug}
              href={href}
              className={`shrink-0 rounded-full px-3 py-1.5 text-[12px] font-semibold ${
                active
                  ? "bg-[var(--dc-gold)]/15 text-[var(--dc-gold)]"
                  : "text-white/45 hover:text-white/70"
              }`}
            >
              {platform.name}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
