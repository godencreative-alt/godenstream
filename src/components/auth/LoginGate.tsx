"use client";

import Link from "next/link";
import { LockClosedIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui";
import { getGoogleLoginUrl } from "@/lib/api";

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
      <LockClosedIcon className="h-16 w-16" style={{ color: accentColor }} />
      <h2
        className="text-2xl font-bold"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Login to Watch
      </h2>
      <p className="max-w-md text-center text-sm text-white/50">
        Sign in with Google to access content. A free account gives you
        access to drama and anime.
      </p>

      <div className="flex gap-3">
        <a href={getGoogleLoginUrl()}>
          <Button variant="primary">Sign in with Google</Button>
        </a>
        <Link href={backHref}>
          <Button variant="ghost">Go Back</Button>
        </Link>
      </div>
    </div>
  );
}
