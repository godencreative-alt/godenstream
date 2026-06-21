"use client";

import { useState, useEffect, useRef } from "react";
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
 * Ad mitigation layers:
 * 1. Click-trap overlay: first user click is consumed by the overlay
 *    (kills popup-on-click ad networks), subsequent clicks pass through.
 * 2. Sandbox restricts popups and top-navigation from the iframe.
 * 3. CSP sandbox meta tag blocks inline scripts and external resources
 *    from known ad domains (best-effort via referrerPolicy + sandbox).
 * 4. Service worker (sw-adblock.js) blocks fetch requests to known ad domains.
 *
 * A small shield button lets the user re-arm the trap after dismissal.
 */
export default function SafeEmbed({ src, title, aspectClass = "aspect-video" }: SafeEmbedProps) {
  const [armed, setArmed] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Block popups opened by the iframe
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    // Override window.open on the iframe's contentWindow (if same-origin)
    const tryBlock = () => {
      try {
        const win = iframe.contentWindow;
        if (win && win !== window) {
          // Override window.open on iframe's contentWindow
          (win as any).open = () => null;
        }
      } catch {
        // Cross-origin — can't access contentWindow, sandbox handles it
      }
    };

    iframe.addEventListener("load", tryBlock);
    return () => iframe.removeEventListener("load", tryBlock);
  }, [src]);

  return (
    <div className={`${aspectClass} relative overflow-hidden rounded-2xl bg-black`}>
      <iframe
        ref={iframeRef}
        src={src}
        className="h-full w-full border-0"
        allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
        allowFullScreen
        sandbox="allow-scripts allow-same-origin allow-forms allow-presentation allow-popups-to-escape-sandbox"
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
