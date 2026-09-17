"use client";

import {
  useEffect,
  useState,
  type ComponentType,
  type ReactNode
} from "react";
import { usePathname } from "next/navigation";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { PROJECT_NAV_ITEMS } from "@/config/navigation";

type PageComp = ComponentType<Record<string, never>>;

/** Top-level sidebar sections → real page modules (preloaded for instant swap). */
const SECTION_LOADERS: Record<string, () => Promise<{ default: PageComp }>> = {
  dashboard: () => import("@/app/(app)/projects/[projectId]/page"),
  documents: () => import("@/app/(app)/projects/[projectId]/documents/page"),
  tenders: () => import("@/app/(app)/projects/[projectId]/tenders/page"),
  contracts: () => import("@/app/(app)/projects/[projectId]/contracts/page"),
  boq: () => import("@/app/(app)/projects/[projectId]/boq/page"),
  progress: () => import("@/app/(app)/projects/[projectId]/progress/page"),
  wips: () => import("@/app/(app)/projects/[projectId]/wips/page"),
  invoices: () => import("@/app/(app)/projects/[projectId]/invoices/page"),
  payments: () => import("@/app/(app)/projects/[projectId]/payments/page"),
  funding: () => import("@/app/(app)/projects/[projectId]/funding/page"),
  compliance: () => import("@/app/(app)/projects/[projectId]/compliance/page"),
  reports: () => import("@/app/(app)/projects/[projectId]/reports/page")
};

const SUFFIX_TO_ID = new Map(
  PROJECT_NAV_ITEMS.map((i) => [i.pathSuffix.replace(/^\//, "") || "dashboard", i.id])
);

let preloadStarted = false;
const moduleCache: Partial<Record<string, PageComp>> = {};
const moduleWaiters: Array<() => void> = [];

function notifyWaiters() {
  for (const w of moduleWaiters) w();
  moduleWaiters.length = 0;
}

/** Warm every sidebar page chunk once the shell mounts. */
export function preloadProjectSections(): void {
  if (typeof window === "undefined") return;
  if (preloadStarted) return;
  preloadStarted = true;
  void Promise.all(
    Object.entries(SECTION_LOADERS).map(async ([id, load]) => {
      try {
        const mod = await load();
        moduleCache[id] = mod.default;
      } catch {
        // leave uncached — outlet will retry on demand
      }
    })
  ).then(notifyWaiters);
}

/** Drop cached page modules (dev HMR / after fetch-pipeline changes). */
export function invalidateSectionModules(): void {
  for (const k of Object.keys(moduleCache)) delete moduleCache[k as keyof typeof moduleCache];
  preloadStarted = false;
}

export function sectionIdFromPath(pathname: string, projectId: string): string | null {
  const base = `/projects/${projectId}`;
  const path = pathname.replace(/\/$/, "") || "";
  if (path === base) return "dashboard";
  if (!path.startsWith(`${base}/`)) return null;
  const rest = path.slice(base.length + 1);
  const parts = rest.split("/").filter(Boolean);
  // Nested routes (tenders/:id, wips/:id/review, …) stay on Next children.
  if (parts.length !== 1) return null;
  return SUFFIX_TO_ID.get(parts[0]) ?? null;
}

export function sectionIdFromHref(href: string, projectId: string): string | null {
  return sectionIdFromPath(href, projectId);
}

type Props = {
  projectId: string;
  pendingSectionId: string | null;
  clientPath: string;
  /** True after a sidebar SPA click — keep using cached modules (Next pushState sync is stale). */
  spaMode: boolean;
  onPendingConsumed: () => void;
  children: ReactNode;
};

function InstantFallback() {
  return (
    <div className="opc-route-loading" aria-busy="true" aria-label="Loading page">
      <TableSkeleton rows={6} cols={5} />
    </div>
  );
}

/**
 * Top-level sections: render preloaded page modules while spaMode is on
 * (sidebar clicks). Nested routes / hard loads use Next `children`.
 *
 * Why spaMode: Next.js patches history.pushState, so usePathname() tracks our
 * SPA URL while `children` can stay on the previous segment — that left the
 * dashboard mounted and its fetches running across every nav.
 */
export function ProjectSectionOutlet({
  projectId,
  pendingSectionId,
  clientPath,
  spaMode,
  onPendingConsumed,
  children
}: Props) {
  const pathname = usePathname() ?? "";
  const pathSection = sectionIdFromPath(clientPath || pathname, projectId);
  const sectionId = pendingSectionId ?? pathSection;

  const [, bump] = useState(0);
  const [local, setLocal] = useState<Partial<Record<string, PageComp>>>({});

  useEffect(() => {
    preloadProjectSections();
    const wake = () => bump((n) => n + 1);
    moduleWaiters.push(wake);
    return () => {
      const i = moduleWaiters.indexOf(wake);
      if (i >= 0) moduleWaiters.splice(i, 1);
    };
  }, []);

  useEffect(() => {
    // Nested Next routes leave spaMode via AppShell; nothing to consume here.
    if (!spaMode) onPendingConsumed();
  }, [spaMode, onPendingConsumed]);

  useEffect(() => {
    if (!sectionId || !spaMode) return;
    // Always re-import so HMR / abort wiring is not stuck on a stale moduleCache entry.
    const load = SECTION_LOADERS[sectionId];
    if (!load) return;
    let cancelled = false;
    void load().then((mod) => {
      if (cancelled) return;
      moduleCache[sectionId] = mod.default;
      setLocal((prev) => ({ ...prev, [sectionId]: mod.default }));
    });
    return () => {
      cancelled = true;
    };
  }, [sectionId, spaMode]);

  // Nested detail routes, or hard load before any SPA click → Next children.
  if (!sectionId || !spaMode) {
    return <>{children}</>;
  }

  const Page = moduleCache[sectionId] ?? local[sectionId];
  if (!Page) return <InstantFallback />;
  return <Page key={`${sectionId}:${projectId}`} />;
}
