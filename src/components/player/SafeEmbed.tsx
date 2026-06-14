"use client";

import { useState } from "react";
import { PlayIcon, ShieldCheckIcon } from "@heroicons/react/24/solid";

interface SafeEmbedProps {
  src: string;
  title?: string;
  /** Tailwind aspect class for the wrapper. Defaults to landscape video. */
  aspectClass?: string;
}

/**
 * Iframe wrapper for third-party embed players.
 *
 * No `sandbox` attribute (several players fail to init <video> under it).
 * Ads are mitigated with a click-trap overlay: first user click is consumed
 * by the overlay (kills popup-on-click ad networks that register on the
 * first user gesture), subsequent clicks reach the iframe normally. A small
 * shield button in the corner lets the user re-arm the trap after dismissal.
 */
export default function SafeEmbed({ src, title, aspectClass = "aspect-video" }: SafeEmbedProps) {
  const [armed, setArmed] = useState(true);

  return (
    <div className={`${aspectClass} relative overflow-hidden rounded-2xl bg-black`}>
      <iframe
        src={src}
        className="h-full w-full border-0"
        allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
        allowFullScreen
        referrerPolicy="no-referrer"
        title={title ?? "Player"}
      />

      {armed && (
        <button
          type="button"
          onClick={() => setArmed(false)}
          aria-label="Tap to play (ad block active)"
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60 text-white backdrop-blur-sm transition hover:bg-black/50"
        >
          <PlayIcon className="h-16 w-16 text-white drop-shadow-lg" />
          <span className="text-sm font-semibold tracking-wide">Tap to Play</span>
          <span className="text-[11px] text-white/60">Ad-click block active</span>
        </button>
      )}

      {!armed && (
        <button
          type="button"
          onClick={() => setArmed(true)}
          aria-label="Re-arm ad-click block"
          title="Re-arm ad-click block"
          className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white/80 backdrop-blur transition hover:bg-black/80 hover:text-white"
        >
          <ShieldCheckIcon className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
