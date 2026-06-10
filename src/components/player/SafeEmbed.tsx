"use client";

interface SafeEmbedProps {
  src: string;
  title?: string;
  /** Tailwind aspect class for the wrapper. Defaults to landscape video. */
  aspectClass?: string;
}

/**
 * Iframe wrapper hardened against third-party popup ads.
 *
 * sandbox combo:
 *   - allow-scripts          → player JS works (HLS.js, controls)
 *   - allow-same-origin      → required by most embed players for cookies
 *   - allow-presentation     → fullscreen / cast
 *   - allow-forms            → some players gate playback behind a form click
 *   - (no allow-popups)      → kills window.open() popunders
 *   - (no allow-top-navigation) → kills window.top.location ad redirects
 *   - (no allow-modals)      → kills alert/confirm spam
 *
 * referrerPolicy=no-referrer also hides the parent URL from ad networks.
 */
export default function SafeEmbed({ src, title, aspectClass = "aspect-video" }: SafeEmbedProps) {
  return (
    <div className={`${aspectClass} overflow-hidden rounded-2xl bg-black`}>
      <iframe
        src={src}
        className="h-full w-full border-0"
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        sandbox="allow-scripts allow-same-origin allow-presentation allow-forms"
        referrerPolicy="no-referrer"
        title={title ?? "Player"}
      />
    </div>
  );
}
