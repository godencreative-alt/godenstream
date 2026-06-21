"use client";

import { useEffect } from "react";

/**
 * Registers the ad-blocking service worker on mount.
 * The SW intercepts fetch requests to known ad domains and returns empty responses.
 */
export default function AdblockSW() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // Small delay to avoid competing with page load
    const timer = setTimeout(() => {
      navigator.serviceWorker
        .register("/sw-adblock.js", { scope: "/" })
        .then((reg) => {
          if (reg.installing) {
            console.log("[Adblock] SW installing...");
          } else if (reg.active) {
            console.log("[Adblock] SW active — blocking ad domains");
          }
        })
        .catch((err) => {
          // Non-critical — don't break the page if SW registration fails
          console.warn("[Adblock] SW registration failed:", err.message);
        });
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return null;
}
