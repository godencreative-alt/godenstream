"use client";

import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 px-4">
      <ExclamationTriangleIcon className="h-16 w-16 text-[var(--dc-gold)]" />
      <h2 className="text-xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
        Something went wrong
      </h2>
      <p className="max-w-md text-center text-sm text-white/50">
        {error.message || "An unexpected error occurred"}
      </p>
      <div className="flex gap-3">
        <Button onClick={reset}>Try Again</Button>
        <a href="/">
          <Button variant="ghost">Home</Button>
        </a>
      </div>
    </div>
  );
}
