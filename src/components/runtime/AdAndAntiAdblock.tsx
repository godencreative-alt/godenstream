"use client";

import { useEffect, useMemo, useState } from "react";
import { useRuntimeSettings } from "./RuntimeSettingsProvider";

export default function AdAndAntiAdblock() {
  const settings = useRuntimeSettings();
  const [blocked, setBlocked] = useState(false);
  const headScript = settings?.ads.headScript.trim() || "";
  const bodyScript = settings?.ads.bodyScript.trim() || "";
  const antiScript = settings?.ads.antiAdblockScript.trim() || "";
  const scripts = useMemo(
    () => [headScript, bodyScript, antiScript].filter(Boolean),
    [headScript, bodyScript, antiScript],
  );

  useEffect(() => {
    const mountedNodes: Node[] = [];
    for (const snippet of scripts) {
      if (snippet.includes("<script")) {
        const template = document.createElement("template");
        template.innerHTML = snippet;
        for (const node of Array.from(template.content.childNodes)) {
          if (node.nodeName.toLowerCase() === "script") {
            const source = node as HTMLScriptElement;
            const script = document.createElement("script");
            for (const attr of Array.from(source.attributes)) {
              script.setAttribute(attr.name, attr.value);
            }
            script.text = source.text;
            document.body.appendChild(script);
            mountedNodes.push(script);
          } else {
            document.body.appendChild(node);
            mountedNodes.push(node);
          }
        }
      } else {
        const script = document.createElement("script");
        script.text = snippet;
        document.body.appendChild(script);
        mountedNodes.push(script);
      }
    }
    return () => mountedNodes.forEach((node) => node.parentNode?.removeChild(node));
  }, [scripts]);

  useEffect(() => {
    if (!settings?.ads.antiAdblockEnabled) return;
    const bait = document.createElement("div");
    bait.className = "adsbox ad-banner adsterra adzilla";
    bait.style.cssText = "position:absolute;left:-9999px;width:1px;height:1px;";
    document.body.appendChild(bait);
    const timer = window.setTimeout(() => {
      const hidden = bait.offsetHeight === 0 || getComputedStyle(bait).display === "none";
      setBlocked(hidden);
      bait.remove();
    }, 800);
    return () => {
      window.clearTimeout(timer);
      bait.remove();
    };
  }, [settings?.ads.antiAdblockEnabled]);

  if (!settings) return null;

  return (
    <>
      {blocked ? (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-6">
          <div className="max-w-md rounded-3xl border border-[var(--dc-gold)]/30 bg-[#111] p-6 text-center shadow-2xl">
            <p className="text-xl font-bold text-white">Adblock terdeteksi</p>
            <p className="mt-3 text-sm leading-6 text-white/60">
              {settings.ads.antiAdblockMessage}
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}
