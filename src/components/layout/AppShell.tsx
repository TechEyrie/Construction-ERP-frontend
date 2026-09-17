"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { NotificationBell } from "@/components/navigation/NotificationBell";
import { ProjectSelector } from "@/components/navigation/ProjectSelector";
import { SidebarNav } from "@/components/navigation/SidebarNav";
import { OfflineBanner } from "@/components/feedback/OfflineBanner";
import {
  invalidateSectionModules,
  preloadProjectSections,
  ProjectSectionOutlet,
  sectionIdFromHref,
  sectionIdFromPath
} from "@/components/layout/ProjectSectionOutlet";
import {
  filterNavForRole,
  MOBILE_QUICK_NAV_IDS,
  PROJECT_NAV_ITEMS,
  projectPath
} from "@/config/navigation";
import { logout } from "@/lib/auth/api";
import { getSessionUser } from "@/lib/auth/session";
import type { AssignedProject } from "@/lib/api/services/projectsService";
import { navAwayAllPageFetches } from "@/lib/api/pageFetchScope";
import {
  bindOfflineListeners,
  setMobileDrawerOpen,
  setSidebarCollapsed
} from "@/lib/shell/shellState";
import { useShellState } from "@/lib/shell/useShellState";
import { setProjectHint } from "@/lib/project/projectHint";
import { ProjectIdProvider } from "@/lib/project/ProjectIdContext";

type Props = {
  projectId: string;
  projects: AssignedProject[];
  current: AssignedProject;
  children: ReactNode;
};

export function AppShell({ projectId, projects, current, children }: Props) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const shell = useShellState();
  const [menuOpen, setMenuOpen] = useState(false);
  const [initials, setInitials] = useState("?");
  /** Instant client path (updates with pushState — does not wait for Next RSC). */
  const [clientPath, setClientPath] = useState(pathname);
  const [pendingSectionId, setPendingSectionId] = useState<string | null>(null);
  /** After sidebar SPA, keep rendering cached page modules (Next pushState sync is unreliable). */
  const [spaMode, setSpaMode] = useState(false);

  useEffect(() => {
    const user = getSessionUser();
    setInitials((user?.name ?? "?").slice(0, 2).toUpperCase());
  }, []);

  setProjectHint(current);

  useEffect(() => bindOfflineListeners(), []);

  // Nested Next routes leave SPA mode; otherwise keep clientPath under our control.
  useEffect(() => {
    const nextSec = sectionIdFromPath(pathname, projectId);
    if (!nextSec && pathname.startsWith(`/projects/${projectId}/`)) {
      setSpaMode(false);
      setPendingSectionId(null);
      setClientPath(pathname);
      return;
    }
    if (!spaMode) setClientPath(pathname);
  }, [pathname, projectId, spaMode]);

  useEffect(() => {
    const onPop = () => {
      const path = window.location.pathname;
      const id = sectionIdFromPath(path, projectId);
      setClientPath(path);
      setPendingSectionId(id);
      setSpaMode(Boolean(id));
      navAwayAllPageFetches();
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [projectId]);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") invalidateSectionModules();
    preloadProjectSections();
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px) and (min-width: 768px)");
    const apply = () => {
      if (window.innerWidth >= 768 && window.innerWidth < 1024) setSidebarCollapsed(true);
      if (window.innerWidth >= 1440) setSidebarCollapsed(false);
    };
    apply();
    mq.addEventListener("change", apply);
    window.addEventListener("resize", apply);
    return () => {
      mq.removeEventListener("change", apply);
      window.removeEventListener("resize", apply);
    };
  }, []);

  /**
   * True SPA nav for top-level sidebar sections:
   * 1) Abort previous page fetches
   * 2) URL via pushState
   * 3) Cached client page mounts (spaMode)
   */
  const onNavigateSection = useCallback(
    (href: string) => {
      const id = sectionIdFromHref(href, projectId);
      if (!id) return;
      navAwayAllPageFetches();
      setSpaMode(true);
      setPendingSectionId(id);
      setClientPath(href);
      if (href !== window.location.pathname) {
        window.history.pushState({ opcSection: id }, "", href);
      }
    },
    [projectId]
  );

  const onPendingConsumed = useCallback(() => setPendingSectionId(null), []);

  const quick = MOBILE_QUICK_NAV_IDS.map((id) => PROJECT_NAV_ITEMS.find((i) => i.id === id)!).filter(
    (i) => filterNavForRole(current.role).some((x) => x.id === i.id)
  );

  async function onLogout() {
    await logout();
    router.replace("/login");
  }

  const activeSectionId =
    pendingSectionId ?? sectionIdFromPath(clientPath, projectId);

  return (
    <div
      className={[
        "opc-shell",
        shell.sidebarCollapsed ? "opc-shell--collapsed" : "",
        shell.mobileDrawerOpen ? "opc-shell--drawer" : "",
        shell.offline ? "opc-shell--offline" : ""
      ]
        .filter(Boolean)
        .join(" ")}
      data-opc-offline={shell.offline ? "true" : "false"}
      data-opc-connectivity={shell.connectivity}
    >
      <header className="opc-shell-header">
        <button
          type="button"
          className="opc-shell-burger"
          aria-label="Open navigation"
          onClick={() => setMobileDrawerOpen(true)}
        >
          ☰
        </button>
        <span className="opc-shell-mark" aria-hidden>
          ◆
        </span>
        <ProjectSelector projectId={projectId} projects={projects} current={current} />
        <div className="opc-shell-header-right">
          <button type="button" className="opc-shell-search" disabled title="Search coming soon">
            Search project… ⌘K
          </button>
          <NotificationBell />
          <div className="opc-shell-avatar-wrap">
            <button
              type="button"
              className="opc-shell-avatar"
              aria-label="Account menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              {initials}
            </button>
            {menuOpen ? (
              <div className="opc-shell-menu" role="menu">
                <button type="button" role="menuitem" onClick={() => void onLogout()}>
                  Logout
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <OfflineBanner connectivity={shell.connectivity} />

      <SidebarNav
        projectId={projectId}
        role={current.role}
        pendingSectionId={activeSectionId}
        onNavigateSection={onNavigateSection}
      />

      <main className="opc-shell-main" data-opc-path={clientPath}>
        <ProjectIdProvider projectId={projectId}>
          <ProjectSectionOutlet
            projectId={projectId}
            pendingSectionId={pendingSectionId}
            clientPath={clientPath}
            spaMode={spaMode}
            onPendingConsumed={onPendingConsumed}
          >
            {children}
          </ProjectSectionOutlet>
        </ProjectIdProvider>
      </main>

      <nav className="opc-shell-bottom" aria-label="Quick navigation">
        {quick.map((item) => {
          const href = projectPath(projectId, item.pathSuffix);
          return (
            <Link
              key={item.id}
              href={href}
              className="opc-shell-bottom-link"
              onClick={(e) => {
                e.preventDefault();
                onNavigateSection(href);
              }}
            >
              <span>{item.shortLabel}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
