import Link from "next/link";
import {
  PlayIcon,
  SparklesIcon,
  FilmIcon,
  TvIcon,
  PlayCircleIcon,
} from "@heroicons/react/24/outline";

const UNIVERSES = [
  {
    key: "drama",
    name: "Short Drama",
    desc: "Bite-sized drama episodes",
    icon: PlayIcon,
    color: "#f5c518",
    gradient: "from-yellow-500/20 to-yellow-700/5",
    minPlan: "free",
  },
  {
    key: "anime",
    name: "Anime",
    desc: "Japanese & global animation",
    icon: SparklesIcon,
    color: "#a78bfa",
    gradient: "from-violet-500/20 to-violet-700/5",
    minPlan: "starter",
  },
  {
    key: "moviebox",
    name: "MovieBox",
    desc: "Movies & series worldwide",
    icon: FilmIcon,
    color: "#fb923c",
    gradient: "from-orange-500/20 to-orange-700/5",
    minPlan: "starter",
  },
  {
    key: "iqiyi",
    name: "iQIYI",
    desc: "Chinese premium content",
    icon: TvIcon,
    color: "#22d3ee",
    gradient: "from-cyan-500/20 to-cyan-700/5",
    minPlan: "premium",
  },
  {
    key: "wetv",
    name: "WeTV",
    desc: "Asian entertainment",
    icon: PlayCircleIcon,
    color: "#f43f5e",
    gradient: "from-rose-500/20 to-rose-700/5",
    minPlan: "premium",
  },
];

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 top-20 h-96 w-96 rounded-full bg-yellow-500/5 blur-[120px]" />
        <div className="absolute -right-32 top-60 h-96 w-96 rounded-full bg-violet-500/5 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 pt-16 pb-20 md:px-6">
        <div className="mb-16 text-center">
          <h1
            className="mb-4 text-4xl font-bold md:text-5xl lg:text-6xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Goden
            <span className="gradient-text-gold">Stream</span>
          </h1>
          <p className="mx-auto max-w-lg text-sm text-white/50 md:text-base">
            Five content universes. One platform. Stream dramas, anime, movies,
            and premium Asian content.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {UNIVERSES.map((u) => {
            const Icon = u.icon;
            return (
              <Link
                key={u.key}
                href={`/${u.key}`}
                className="group relative overflow-hidden rounded-2xl border border-white/[0.06] p-6 transition-all hover:border-white/[0.12] hover:shadow-lg"
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${u.gradient} opacity-0 transition-opacity group-hover:opacity-100`}
                />
                <div className="relative">
                  <Icon
                    className="mb-4 h-8 w-8"
                    style={{ color: u.color }}
                  />
                  <h3 className="mb-1 text-base font-bold text-white">
                    {u.name}
                  </h3>
                  <p className="text-[12px] text-white/40">{u.desc}</p>

                  {u.minPlan !== "free" && (
                    <span
                      className="mt-3 inline-flex items-center rounded-md border px-1.5 py-0.5 text-[9px] font-medium"
                      style={{
                        borderColor: `${u.color}30`,
                        background: `${u.color}15`,
                        color: u.color,
                      }}
                    >
                      {u.minPlan === "premium" ? "PREMIUM" : "STARTER"}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
