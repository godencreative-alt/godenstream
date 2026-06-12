"use client";

interface SafeEmbedProps {
  src: string;
  title?: string;
  /** Tailwind aspect class for the wrapper. Defaults to landscape video. */
  aspectClass?: string;
}

/**
 * Iframe wrapper for third-party embed players.
 *
 * sandbox combo (balanced — players need popups to function):
 *   - allow-scripts                    → player JS works (HLS.js, controls)
 *   - allow-same-origin                → required by most embed players for cookies
 *   - allow-presentation               → fullscreen / cast
 *   - allow-forms                      → some players gate playback behind a form click
 *   - allow-popups                     → many players open quality/source pickers as popup
 *   - allow-popups-to-escape-sandbox   → so opened popups aren't crippled
 *   - (no allow-top-navigation)        → kills window.top.location ad redirects on parent
 *   - (no allow-modals)                → kills alert/confirm spam
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
        sandbox="allow-scripts allow-same-origin allow-presentation allow-forms allow-popups allow-popups-to-escape-sandbox"
        referrerPolicy="no-referrer"
        title={title ?? "Player"}
      />
    </div>
  );
}
