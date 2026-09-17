"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { forceLogout } from "@/lib/auth/api";
import {
  getAccessToken,
  getAccessTokenExpiresAtMs,
  isAccessTokenExpired
} from "@/lib/auth/session";

const AUTH_PATH_PREFIXES = ["/login", "/forgot-password", "/reset-password"];

function isAuthRoute(pathname: string | null): boolean {
  if (!pathname) return false;
  return AUTH_PATH_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/**
 * When the access JWT expires, log the user out (no silent refresh).
 */
export function AuthLifecycle() {
  const pathname = usePathname();

  useEffect(() => {
    if (isAuthRoute(pathname)) return;

    let timer: ReturnType<typeof setTimeout> | undefined;

    const check = () => {
      const token = getAccessToken();
      if (!token) return;
      if (isAccessTokenExpired()) {
        void forceLogout();
        return;
      }
      const exp = getAccessTokenExpiresAtMs(token);
      if (exp != null) {
        if (timer) clearTimeout(timer);
        const delay = Math.max(0, exp - Date.now() - 1_500);
        timer = setTimeout(() => {
          void forceLogout();
        }, delay);
      }
    };

    check();
    const interval = setInterval(check, 20_000);
    const onFocus = () => check();
    const onVis = () => {
      if (document.visibilityState === "visible") check();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVis);

    return () => {
      if (timer) clearTimeout(timer);
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [pathname]);

  return null;
}
