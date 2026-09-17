import { getApiBaseUrl } from "@/lib/api/baseUrl";
import {
  clearSession,
  getAccessToken,
  getSessionUser,
  isAccessTokenExpired,
  setSession
} from "./session";

type Envelope<T> = {
  success: boolean;
  data: T | null;
  meta: { requestId: string };
  error: { code: string; message: string } | null;
};

async function parseJson<T>(res: Response): Promise<Envelope<T>> {
  return (await res.json()) as Envelope<T>;
}

const AUTH_PATH_PREFIXES = ["/login", "/forgot-password", "/reset-password"];

function isAuthRoute(pathname: string): boolean {
  return AUTH_PATH_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

let logoutInFlight: Promise<void> | null = null;

/**
 * Clear local session, revoke refresh cookie, send user to login.
 * Access-token expiry logs the user out by default (no silent refresh).
 */
export async function forceLogout(): Promise<void> {
  if (typeof window === "undefined") {
    clearSession();
    return;
  }
  if (logoutInFlight) return logoutInFlight;

  logoutInFlight = (async () => {
    const token = getAccessToken();
    clearSession();
    // Redirect immediately — don't block workspace on a slow/failed logout call
    const shouldRedirect = !isAuthRoute(window.location.pathname);
    if (shouldRedirect) {
      window.location.replace("/login");
    }
    try {
      await fetch(`${getApiBaseUrl()}/api/v1/auth/logout`, {
        method: "POST",
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
    } catch {
      /* best-effort cookie clear */
    }
  })().finally(() => {
    logoutInFlight = null;
  });

  return logoutInFlight;
}

/** If access JWT is past exp, force logout. Returns true when still valid. */
export async function ensureAccessTokenValid(): Promise<boolean> {
  if (!getAccessToken()) return false;
  if (isAccessTokenExpired()) {
    await forceLogout();
    return false;
  }
  return true;
}

export async function login(email: string, password: string) {
  const res = await fetch(`${getApiBaseUrl()}/api/v1/auth/login`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  const body = await parseJson<{
    accessToken: string;
    user: { id: string; name: string; email: string; roles: string[] };
  }>(res);
  if (!res.ok || !body.success || !body.data) {
    throw Object.assign(new Error(body.error?.message ?? "Login failed"), {
      code: body.error?.code,
      status: res.status
    });
  }
  setSession(body.data.accessToken, body.data.user);
  return body.data;
}

export async function logout() {
  const token = getAccessToken();
  await fetch(`${getApiBaseUrl()}/api/v1/auth/logout`, {
    method: "POST",
    credentials: "include",
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  }).catch(() => undefined);
  clearSession();
}

export async function forgotPassword(email: string) {
  const res = await fetch(`${getApiBaseUrl()}/api/v1/auth/forgot-password`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email })
  });
  const body = await parseJson<{ accepted: boolean }>(res);
  if (!res.ok || !body.success) {
    throw new Error(body.error?.message ?? "Request failed");
  }
}

export async function resetPassword(token: string, newPassword: string) {
  const res = await fetch(`${getApiBaseUrl()}/api/v1/auth/reset-password`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, newPassword })
  });
  const body = await parseJson<{ reset: boolean }>(res);
  if (!res.ok || !body.success) {
    throw new Error(body.error?.message ?? "Reset failed");
  }
}

/**
 * @deprecated Access expiry logs the user out by default — do not silent-refresh.
 * Kept for compatibility; always clears session and returns false.
 */
export async function tryRefresh(): Promise<boolean> {
  clearSession();
  return false;
}

export { getSessionUser };
