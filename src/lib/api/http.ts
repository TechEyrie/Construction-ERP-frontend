import { getApiBaseUrl } from "@/lib/api/baseUrl";
import { isAbortError } from "@/lib/api/abort";
import { forceLogout } from "@/lib/auth/api";
import { getAccessToken, isAccessTokenExpired } from "@/lib/auth/session";
import { markApiReachable } from "@/lib/shell/shellState";

type Envelope<T> = {
  success: boolean;
  data: T | null;
  error: { code: string; message: string } | null;
  meta?: Record<string, unknown>;
};

const AUTH_FAIL_CODES = new Set(["TOKEN_EXPIRED", "INVALID_TOKEN", "UNAUTHORIZED", "AUTH_REQUIRED"]);

function isAuthFailure(status: number, code?: string | null): boolean {
  if (status === 401) return true;
  if (code && AUTH_FAIL_CODES.has(code)) return true;
  return false;
}

async function handleAuthFailure(status: number, code?: string | null): Promise<void> {
  if (!isAuthFailure(status, code)) return;
  await forceLogout();
}

async function authedFetch(path: string, init?: RequestInit): Promise<Response> {
  if (init?.signal?.aborted) {
    throw new DOMException("The operation was aborted.", "AbortError");
  }

  if (getAccessToken() && isAccessTokenExpired()) {
    await forceLogout();
    throw Object.assign(new Error("Access token expired"), {
      code: "TOKEN_EXPIRED",
      status: 401
    });
  }

  const token = getAccessToken();
  const headers = new Headers(init?.headers);
  if (!headers.has("Content-Type") && init?.body && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);

  return fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    credentials: "include",
    headers
  });
}

/**
 * Authenticated JSON API helper. On access-token expiry / 401, logs the user out.
 * Pass `signal` in init to cancel on navigation.
 */
export async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await authedFetch(path, init);

  let body: Envelope<T>;
  try {
    body = (await res.json()) as Envelope<T>;
  } catch (err) {
    if (isAbortError(err) || init?.signal?.aborted) {
      throw err instanceof Error ? err : new DOMException("Aborted", "AbortError");
    }
    await handleAuthFailure(res.status);
    throw Object.assign(new Error(`HTTP ${res.status}`), { status: res.status });
  }

  if (!res.ok || !body.success || body.data === null) {
    await handleAuthFailure(res.status, body.error?.code);
    throw Object.assign(new Error(body.error?.message ?? `HTTP ${res.status}`), {
      code: body.error?.code,
      status: res.status
    });
  }

  markApiReachable();
  return body.data;
}

/** Same as apiJson but also returns envelope meta (pagination, etc.). */
export async function apiJsonWithMeta<T>(
  path: string,
  init?: RequestInit
): Promise<{ data: T; meta?: Envelope<T>["meta"] }> {
  const res = await authedFetch(path, init);

  let body: Envelope<T>;
  try {
    body = (await res.json()) as Envelope<T>;
  } catch (err) {
    if (isAbortError(err) || init?.signal?.aborted) {
      throw err instanceof Error ? err : new DOMException("Aborted", "AbortError");
    }
    await handleAuthFailure(res.status);
    throw Object.assign(new Error(`HTTP ${res.status}`), { status: res.status });
  }

  if (!res.ok || !body.success || body.data === null) {
    await handleAuthFailure(res.status, body.error?.code);
    throw Object.assign(new Error(body.error?.message ?? `HTTP ${res.status}`), {
      code: body.error?.code,
      status: res.status
    });
  }

  markApiReachable();
  return { data: body.data, meta: body.meta };
}

/** For raw/binary fetches that still need 401 → logout. */
export async function apiRaw(path: string, init?: RequestInit): Promise<Response> {
  const res = await authedFetch(path, init);
  if (res.status === 401) {
    await forceLogout();
  } else if (res.ok) {
    markApiReachable();
  }
  return res;
}
