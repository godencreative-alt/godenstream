"use client";

import Link from "next/link";
import { ShieldCheckIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui";

interface PlanGateProps {
  requiredPlan: string;
  sectionName: string;
  accentColor?: string;
  backHref?: string;
}

export default function PlanGate({
  requiredPlan,
  sectionName,
  accentColor = "var(--dc-gold)",
  backHref = "/",
}: PlanGateProps) {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 px-4">
      <ShieldCheckIcon
        className="h-16 w-16"
        style={{ color: accentColor }}
      />
      <h2
        className="text-2xl font-bold"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {requiredPlan.charAt(0).toUpperCase() + requiredPlan.slice(1)} Plan
        Required
      </h2>
      <p className="max-w-md text-center text-sm text-white/50">
        {sectionName} content requires a {requiredPlan} subscription or higher.
        Upgrade your plan to start watching.
      </p>

      <div className="flex gap-3">
        <Link href="/pricing">
          <Button variant="primary">View Plans</Button>
        </Link>
        <Link href={backHref}>
          <Button variant="ghost">Go Back</Button>
        </Link>
      </div>
    </div>
  );
}
