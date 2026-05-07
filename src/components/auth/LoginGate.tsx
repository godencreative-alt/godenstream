"use client";

import Link from "next/link";
import { LockClosedIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui";

interface LoginGateProps {
  backHref?: string;
  accentColor?: string;
}

export default function LoginGate({
  backHref = "/",
  accentColor = "var(--dc-gold)",
}: LoginGateProps) {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 px-4">
      <LockClosedIcon
        className="h-16 w-16"
        style={{ color: accentColor }}
      />
      <h2
        className="text-2xl font-bold"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Login to Watch
      </h2>
      <p className="max-w-md text-center text-sm text-white/50">
        Create a free account or log in to access this content. Premium content
        requires a subscription.
      </p>

      <div className="overflow-hidden rounded-xl border border-white/[0.08]">
        <table className="text-[12px]">
          <thead>
            <tr className="border-b border-white/[0.06] bg-white/[0.02]">
              <th className="px-4 py-2 text-left font-medium text-white/40">
                Plan
              </th>
              <th className="px-4 py-2 text-left font-medium text-white/40">
                Access
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-white/[0.06]">
              <td className="px-4 py-2 text-white/60">Free</td>
              <td className="px-4 py-2 text-white/60">Drama only</td>
            </tr>
            <tr className="border-b border-white/[0.06]">
              <td className="px-4 py-2 text-white/60">Starter</td>
              <td className="px-4 py-2 text-white/60">
                Drama + Anime + MovieBox
              </td>
            </tr>
            <tr>
              <td className="px-4 py-2 text-white/60">Premium</td>
              <td className="px-4 py-2 text-white/60">All sections</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="flex gap-3">
        <Button variant="primary">Login</Button>
        <Button variant="outline">Register</Button>
        <Link href={backHref}>
          <Button variant="ghost">Go Back</Button>
        </Link>
      </div>
    </div>
  );
}
