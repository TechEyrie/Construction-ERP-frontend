/** Access token + user — sessionStorage so soft/hard nav keep auth (shell). */

export type SessionUser = { id: string; name: string; email: string; roles: string[] };

const TOKEN_KEY = "opc_access_token";
const USER_KEY = "opc_session_user";

let accessToken: string | null = null;
let user: SessionUser | null = null;
let hydrated = false;

function hydrate(): void {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  accessToken = sessionStorage.getItem(TOKEN_KEY);
  const raw = sessionStorage.getItem(USER_KEY);
  if (raw) {
    try {
      user = JSON.parse(raw) as SessionUser;
    } catch {
      user = null;
    }
  }
}

/** JWT `exp` as epoch ms, or null if missing/unreadable. */
export function getAccessTokenExpiresAtMs(token?: string | null): number | null {
  const t = token === undefined ? getAccessToken() : token;
  if (!t) return null;
  const parts = t.split(".");
  if (parts.length < 2 || !parts[1]) return null;
  try {
    const json = atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(json) as { exp?: unknown };
    return typeof payload.exp === "number" ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

/** True when no token or JWT exp is past (small skew). */
export function isAccessTokenExpired(skewMs = 3_000): boolean {
  const token = getAccessToken();
  if (!token) return true;
  const exp = getAccessTokenExpiresAtMs(token);
  if (exp == null) return false;
  return Date.now() >= exp - skewMs;
}

export function getAccessToken(): string | null {
  hydrate();
  return accessToken;
}

export function setSession(token: string, u: SessionUser): void {
  accessToken = token;
  user = u;
  hydrated = true;
  if (typeof window !== "undefined") {
    sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(USER_KEY, JSON.stringify(u));
  }
}

export function clearSession(): void {
  accessToken = null;
  user = null;
  hydrated = true;
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
  }
}

export function getSessionUser(): SessionUser | null {
  hydrate();
  return user;
}
