"use client";

import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

interface ErrorStateProps {
  message?: string;
  retry?: () => void;
}

export function ErrorState({
  message = "Gagal memuat data. Coba lagi nanti.",
  retry,
}: ErrorStateProps) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <ExclamationTriangleIcon className="h-12 w-12 text-red-400/70" />
      <p className="max-w-md text-sm text-white/60">{message}</p>
      {retry && (
        <button
          onClick={retry}
          className="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/20"
        >
          Coba Lagi
        </button>
      )}
    </div>
  );
}
