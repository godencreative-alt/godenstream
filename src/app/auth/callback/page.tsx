"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useAuthStore } from "@/store/auth";
import { Spinner } from "@/components/ui/Spinner";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setSession = useAuthStore((s) => s.setSession);
  const calledRef = useRef(false);

  useEffect(() => {
    if (calledRef.current) return;
    calledRef.current = true;

    const token = searchParams.get("token");
    const error = searchParams.get("error");

    if (error || !token) {
      router.replace(`/?auth_error=${error || "missing_token"}`);
      return;
    }

    setSession(token)
      .then(() => {
        // Scrub token from URL/history before redirecting away
        if (typeof window !== "undefined") {
          window.history.replaceState({}, "", "/auth/callback");
        }
        router.replace("/");
      })
      .catch(() => router.replace("/?auth_error=session_failed"));
  }, [searchParams, setSession, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <Spinner size="lg" />
      <p className="text-sm text-white/50">Signing you in…</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Spinner size="lg" />
        </div>
      }
    >
      <CallbackHandler />
    </Suspense>
  );
}
