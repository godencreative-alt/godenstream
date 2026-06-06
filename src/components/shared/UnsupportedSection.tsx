"use client";

import Link from "next/link";
import { ArrowRightIcon } from "@heroicons/react/24/outline";

interface UnsupportedSectionProps {
  name: string;
  reason?: string;
  primaryHref?: string;
  primaryLabel?: string;
}

export default function UnsupportedSection({
  name,
  reason = "This section is not available on goden.store.",
  primaryHref = "/",
  primaryLabel = "Back to Home",
}: UnsupportedSectionProps) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-4 px-4 text-center">
      <h1
        className="text-2xl font-bold text-white md:text-3xl"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {name} unavailable
      </h1>
      <p className="text-sm text-white/55">{reason}</p>
      <Link
        href={primaryHref}
        className="inline-flex items-center gap-2 rounded-full bg-[var(--dc-gold)] px-4 py-2 text-sm font-bold text-black"
      >
        {primaryLabel}
        <ArrowRightIcon className="h-4 w-4" />
      </Link>
    </div>
  );
}
