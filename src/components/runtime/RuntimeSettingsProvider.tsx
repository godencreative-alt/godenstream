"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { PublicSettings } from "@/lib/admin/types";

const SettingsContext = createContext<PublicSettings | null>(null);

export function useRuntimeSettings() {
  return useContext(SettingsContext);
}

export default function RuntimeSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<PublicSettings | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: PublicSettings | null) => {
        if (data) setSettings(data);
      })
      .catch(() => {});

    const key = `visit:${new Date().toISOString().slice(0, 10)}`;
    if (!sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, "1");
      fetch("/api/analytics/visit", { method: "POST" }).catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (!settings) return;
    document.documentElement.style.setProperty("--brand-logo-url", `url("${settings.whitelabel.logoUrl}")`);
    if (settings.whitelabel.faviconUrl) {
      let icon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
      if (!icon) {
        icon = document.createElement("link");
        icon.rel = "icon";
        document.head.appendChild(icon);
      }
      icon.href = settings.whitelabel.faviconUrl;
    }
  }, [settings]);

  return <SettingsContext.Provider value={settings}>{children}</SettingsContext.Provider>;
}
