/** Ephemeral shell UI state — module store (no Zustand). */

type Listener = () => void;

export type Connectivity = "online" | "offline" | "api-unreachable";

export type RoutePending = {
  href: string;
  label: string;
  at: number;
  /** Pathname when click started — clear pending on any URL change. */
  from: string;
} | null;

type ShellState = {
  sidebarCollapsed: boolean;
  mobileDrawerOpen: boolean;
  projectSelectorOpen: boolean;
  /** @deprecated prefer `connectivity` — true when not fully online */
  offline: boolean;
  connectivity: Connectivity;
  /** Optimistic main-pane skeleton until Next finishes soft-nav. */
  routePending: RoutePending;
};

let state: ShellState = {
  sidebarCollapsed: false,
  mobileDrawerOpen: false,
  projectSelectorOpen: false,
  // Fixed defaults for SSR/client hydration match — bindOfflineListeners updates after mount
  offline: false,
  connectivity: "online",
  routePending: null
};

const listeners = new Set<Listener>();
let healthFailStreak = 0;
let probeTimer: number | null = null;

function emit() {
  for (const l of listeners) l();
}

export function getShellState(): ShellState {
  return state;
}

export function subscribeShell(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function toggleSidebar(): void {
  state = { ...state, sidebarCollapsed: !state.sidebarCollapsed };
  emit();
}

export function setSidebarCollapsed(collapsed: boolean): void {
  state = { ...state, sidebarCollapsed: collapsed };
  emit();
}

export function setMobileDrawerOpen(open: boolean): void {
  state = { ...state, mobileDrawerOpen: open };
  emit();
}

export function setProjectSelectorOpen(open: boolean): void {
  state = { ...state, projectSelectorOpen: open };
  emit();
}

/** Paint page chrome instantly on sidebar click; clear when pathname catches up. */
export function setRoutePending(pending: RoutePending): void {
  state = { ...state, routePending: pending };
  emit();
}

export function clearRoutePending(): void {
  if (!state.routePending) return;
  state = { ...state, routePending: null };
  emit();
}

export function setOfflineStatus(offline: boolean): void {
  setConnectivity(offline ? "offline" : "online");
}

export function setConnectivity(connectivity: Connectivity): void {
  const offline = connectivity !== "online";
  if (state.connectivity === connectivity && state.offline === offline) return;
  state = { ...state, connectivity, offline };
  emit();
  scheduleProbeInterval();
}

/** Any successful API response can clear a false "unreachable" banner immediately. */
export function markApiReachable(): void {
  if (typeof navigator !== "undefined" && !navigator.onLine) return;
  healthFailStreak = 0;
  setConnectivity("online");
}

async function probeHealth(): Promise<"ok" | "fail" | "skip"> {
  try {
    if (typeof navigator !== "undefined" && !navigator.onLine) return "fail";
    const ctrl = new AbortController();
    const t = window.setTimeout(() => ctrl.abort(), 2500);
    // Hit opc-api directly — avoid Next rewrite queue during RSC compile.
    const base = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/$/, "");
    const res = await fetch(`${base}/healthz`, {
      method: "GET",
      signal: ctrl.signal,
      cache: "no-store",
      credentials: "include"
    });
    window.clearTimeout(t);
    return res.ok ? "ok" : "fail";
  } catch (err) {
    // Navigation / StrictMode teardown aborts in-flight probes — not a real outage
    if (err instanceof DOMException && err.name === "AbortError") return "skip";
    if (err instanceof Error && /abort/i.test(err.message)) return "skip";
    return "fail";
  }
}

function scheduleProbeInterval(): void {
  if (typeof window === "undefined") return;
  if (probeTimer != null) {
    window.clearInterval(probeTimer);
    probeTimer = null;
  }
  // Recover quickly while degraded; idle online checks stay light
  const ms = state.connectivity === "online" ? 45_000 : 4_000;
  probeTimer = window.setInterval(() => {
    void syncConnectivity();
  }, ms);
}

async function syncConnectivity(): Promise<void> {
  if (!navigator.onLine) {
    healthFailStreak = 0;
    setConnectivity("offline");
    return;
  }
  const result = await probeHealth();
  if (!navigator.onLine) {
    setConnectivity("offline");
    return;
  }
  if (result === "skip") return;
  if (result === "ok") {
    healthFailStreak = 0;
    setConnectivity("online");
    return;
  }
  healthFailStreak += 1;
  // Three real misses before banner — avoids flash during slow boots / HMR
  if (healthFailStreak >= 3) setConnectivity("api-unreachable");
}

/** Bind window online/offline + API healthz probe (README_32 BR-04). */
export function bindOfflineListeners(): () => void {
  if (typeof window === "undefined") return () => undefined;

  const on = () => {
    healthFailStreak = 0;
    void syncConnectivity();
  };
  const off = () => {
    healthFailStreak = 0;
    setConnectivity("offline");
  };
  window.addEventListener("online", on);
  window.addEventListener("offline", off);
  void syncConnectivity();
  scheduleProbeInterval();

  return () => {
    window.removeEventListener("online", on);
    window.removeEventListener("offline", off);
    if (probeTimer != null) {
      window.clearInterval(probeTimer);
      probeTimer = null;
    }
  };
}
