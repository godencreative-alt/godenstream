"use client";

import { useRef } from "react";
import Link from "next/link";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";

interface SwipeCarouselProps {
  title: string;
  viewAllHref?: string;
  accentColor?: string;
  className?: string;
  children: React.ReactNode;
}

export default function SwipeCarousel({
  title,
  viewAllHref,
  accentColor = "gold",
  className,
  children,
}: SwipeCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const dragDist = useRef(0);

  const accentColorClass =
    accentColor === "gold"
      ? "text-[var(--dc-gold)]"
      : accentColor === "violet"
        ? "text-[var(--dc-violet)]"
        : accentColor === "orange"
          ? "text-[var(--dc-orange)]"
          : accentColor === "cyan"
            ? "text-[var(--dc-cyan)]"
            : accentColor === "rose"
              ? "text-[var(--dc-rose)]"
              : "text-white/60";

  return (
    <section className={cn("mb-8", className)}>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold text-white">{title}</h2>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className={`text-xs font-medium ${accentColorClass} hover:brightness-110`}
          >
            View All <ChevronRightIcon className="inline h-3 w-3" />
          </Link>
        )}
      </div>

      <div
        ref={scrollRef}
        className="no-scrollbar flex gap-3 overflow-x-auto scroll-smooth"
        onMouseDown={(e) => {
          isDragging.current = true;
          dragDist.current = 0;
          startX.current = e.pageX;
          scrollLeft.current = scrollRef.current?.scrollLeft ?? 0;
        }}
        onMouseMove={(e) => {
          if (!isDragging.current || !scrollRef.current) return;
          const dx = e.pageX - startX.current;
          dragDist.current = Math.abs(dx);
          scrollRef.current.scrollLeft = scrollLeft.current - dx;
        }}
        onMouseUp={() => {
          isDragging.current = false;
        }}
        onMouseLeave={() => {
          isDragging.current = false;
        }}
      >
        {children}
      </div>
    </section>
  );
}
