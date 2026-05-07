import { CheckIcon } from "@heroicons/react/24/solid";

const plans = [
  {
    name: "Free",
    price: "$0",
    features: ["Short Drama access", "720p quality", "Ads supported"],
    accent: "var(--dc-gold)",
    popular: false,
  },
  {
    name: "Starter",
    price: "$4.99",
    period: "/mo",
    features: ["Drama + Anime + MovieBox", "1080p quality", "No ads", "Watch history sync"],
    accent: "var(--dc-violet)",
    popular: true,
  },
  {
    name: "Premium",
    price: "$9.99",
    period: "/mo",
    features: ["All 5 sections", "4K quality", "No ads", "Priority support", "Offline downloads"],
    accent: "var(--dc-cyan)",
    popular: false,
  },
];

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 md:px-6">
      <div className="mb-12 text-center">
        <h1 className="mb-3 text-3xl font-bold md:text-4xl" style={{ fontFamily: "var(--font-display)" }}>
          Choose Your Plan
        </h1>
        <p className="text-sm text-white/50">
          Unlock more content across all universes
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`relative overflow-hidden rounded-2xl border p-6 ${
              plan.popular
                ? "border-[var(--dc-violet)]/30 bg-[var(--dc-violet)]/5"
                : "border-white/[0.06]"
            }`}
          >
            {plan.popular && (
              <span className="absolute right-4 top-4 rounded-full bg-[var(--dc-violet)]/20 px-2.5 py-0.5 text-[10px] font-bold text-[var(--dc-violet)]">
                POPULAR
              </span>
            )}
            <h3 className="text-lg font-bold" style={{ color: plan.accent }}>
              {plan.name}
            </h3>
            <div className="mt-3 mb-6">
              <span className="text-3xl font-bold">{plan.price}</span>
              {plan.period && (
                <span className="text-sm text-white/40">{plan.period}</span>
              )}
            </div>
            <ul className="space-y-3">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-white/60">
                  <CheckIcon className="h-4 w-4 shrink-0" style={{ color: plan.accent }} />
                  {f}
                </li>
              ))}
            </ul>
            <button
              className="mt-6 w-full rounded-xl py-2.5 text-sm font-semibold transition-colors"
              style={{
                backgroundColor: `${plan.accent}20`,
                color: plan.accent,
              }}
            >
              Get {plan.name}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
