"use client";

import { useEffect } from "react";

/** Registers shell SW when PWA is enabled (skip in Playwright via NEXT_PUBLIC_PWA_DISABLED=1). */
export function RegisterServiceWorker() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (process.env.NEXT_PUBLIC_PWA_DISABLED === "1") return;
    if (!("serviceWorker" in navigator)) return;
    const host = window.location.hostname;
    // Dev servers reuse stable /_next/static chunk URLs — SW cache-first breaks HMR/UI fixes.
    if (host === "localhost" || host === "127.0.0.1" || host.endsWith(".local")) {
      void navigator.serviceWorker.getRegistrations().then((regs) => {
        for (const r of regs) void r.unregister();
      });
      return;
    }
    const id = window.setTimeout(() => {
      void navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }, 800);
    return () => window.clearTimeout(id);
  }, []);
  return null;
}
