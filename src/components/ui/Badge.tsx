import { cn } from "@/lib/utils";

type BadgeVariant =
  | "gold"
  | "violet"
  | "orange"
  | "cyan"
  | "rose"
  | "ghost"
  | "custom";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  gold: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  violet: "bg-violet-500/20 text-violet-300 border-violet-500/30",
  orange: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  cyan: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  rose: "bg-rose-500/20 text-rose-300 border-rose-500/30",
  ghost: "bg-white/5 text-white/50 border-white/10",
  custom: "",
};

export default function Badge({
  variant = "ghost",
  children,
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium",
        variantStyles[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
