"use client";

interface PillTab {
  value: string;
  label: string;
  disabled?: boolean;
}

interface PillTabsProps {
  tabs: PillTab[];
  selected: string;
  onSelect: (value: string) => void;
  accentColor?: string;
}

export default function PillTabs({
  tabs,
  selected,
  onSelect,
  accentColor = "var(--dc-gold)",
}: PillTabsProps) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filter options">
      {tabs.map((t) => {
        const isActive = selected === t.value;
        return (
          <button
            key={t.value}
            type="button"
            onClick={() => !t.disabled && onSelect(t.value)}
            disabled={t.disabled}
            className={`rounded-full px-4 py-1.5 text-[12px] font-semibold transition-colors ${
              isActive
                ? t.disabled
                  ? "bg-white/10 text-white/50"
                  : "text-white"
                : t.disabled
                  ? "border border-white/[0.08] text-white/30"
                  : "border border-white/[0.08] text-white/45 hover:text-white/70"
            }`}
            style={isActive && !t.disabled ? { backgroundColor: accentColor } : undefined}
            aria-pressed={isActive}
          >
            {t.label}
            {t.disabled && <span className="ml-1 text-[9px]">(soon)</span>}
          </button>
        );
      })}
    </div>
  );
}
