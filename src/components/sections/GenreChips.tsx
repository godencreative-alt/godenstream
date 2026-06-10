"use client";

interface GenreChipsProps {
  genres: string[];
  selected: string;
  onSelect: (genre: string) => void;
  accentClass?: string; // tailwind classes for active state, e.g. "bg-[var(--dc-cyan)]/20 text-[var(--dc-cyan)]"
}

/**
 * Reusable genre filter chips. Click toggles selection; pass empty string to clear.
 */
export default function GenreChips({
  genres,
  selected,
  onSelect,
  accentClass = "bg-[var(--dc-cyan)]/20 text-[var(--dc-cyan)]",
}: GenreChipsProps) {
  if (!genres.length) return null;

  return (
    <div className="mb-6 flex flex-wrap gap-2">
      {genres.map((g) => {
        const active = selected === g;
        return (
          <button
            key={g}
            type="button"
            onClick={() => onSelect(active ? "" : g)}
            className={`rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors ${
              active
                ? accentClass
                : "border border-white/[0.08] text-white/45 hover:text-white/70"
            }`}
          >
            {g}
          </button>
        );
      })}
    </div>
  );
}
