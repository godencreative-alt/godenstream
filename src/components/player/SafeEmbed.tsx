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
 * No `sandbox` attribute: several players (streamv.site, hydrax, etc.) fail
 * to initialize their <video> element under sandbox restrictions, so we drop
 * it to keep every source playable. Ad mitigation without sandbox relies on:
 *   - referrerPolicy=no-referrer   → hides the parent URL from ad networks
 *   - narrow `allow=` permissions  → only autoplay/fullscreen/pip/encrypted
 *   - browser defaults             → modern browsers block auto-popups and
 *                                     gate top-navigation behind a user gesture
 *
 * Trade-off: popup-on-click ads triggered by a real user click can still get
 * through. This is the cost of guaranteeing playback for every embed host.
 */
export default function SafeEmbed({ src, title, aspectClass = "aspect-video" }: SafeEmbedProps) {
  return (
    <div className={`${aspectClass} overflow-hidden rounded-2xl bg-black`}>
      <iframe
        src={src}
        className="h-full w-full border-0"
        allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
        allowFullScreen
        referrerPolicy="no-referrer"
        title={title ?? "Player"}
      />
    </div>
  );
}
