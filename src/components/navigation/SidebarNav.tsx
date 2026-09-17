"use client";

import { filterNavForRole, projectPath, type NavItem } from "@/config/navigation";
import { setMobileDrawerOpen, toggleSidebar } from "@/lib/shell/shellState";
import { useShellState } from "@/lib/shell/useShellState";

type Props = {
  projectId: string;
  role: string;
  /** Active section id from AppShell (pushState-aware). */
  pendingSectionId?: string | null;
  /** SPA nav: URL + real page immediately (handled by AppShell). */
  onNavigateSection?: (href: string) => void;
};

function isActivePath(pathname: string, projectId: string, item: NavItem): boolean {
  const href = projectPath(projectId, item.pathSuffix);
  if (item.pathSuffix === "") {
    return pathname === href || pathname === `${href}/`;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SidebarNav({ projectId, role, pendingSectionId = null, onNavigateSection }: Props) {
  const { sidebarCollapsed, mobileDrawerOpen } = useShellState();
  const items = filterNavForRole(role);

  return (
    <>
      {mobileDrawerOpen ? (
        <button
          type="button"
          className="opc-shell-backdrop"
          aria-label="Close menu"
          onClick={() => setMobileDrawerOpen(false)}
        />
      ) : null}
      <aside
        className={[
          "opc-sidebar",
          sidebarCollapsed ? "opc-sidebar--collapsed" : "",
          mobileDrawerOpen ? "opc-sidebar--open" : ""
        ]
          .filter(Boolean)
          .join(" ")}
        aria-label="Project navigation"
      >
        <nav className="opc-sidebar-nav">
          {items.map((item) => {
            const href = projectPath(projectId, item.pathSuffix);
            const active = pendingSectionId
              ? pendingSectionId === item.id
              : typeof window !== "undefined" &&
                isActivePath(window.location.pathname, projectId, item);
            return (
              <a
                key={item.id}
                href={href}
                className={["opc-nav-link", active ? "opc-nav-link--active" : ""].filter(Boolean).join(" ")}
                title={item.label}
                data-nav-id={item.id}
                onClick={(e) => {
                  e.preventDefault();
                  setMobileDrawerOpen(false);
                  if (active) return;
                  onNavigateSection?.(href);
                }}
              >
                <span className="opc-nav-ico" aria-hidden>
                  {item.shortLabel.slice(0, 1)}
                </span>
                <span className="opc-nav-label">{item.label}</span>
              </a>
            );
          })}
        </nav>
        <button
          type="button"
          className="opc-sidebar-collapse"
          onClick={() => toggleSidebar()}
          aria-label="Collapse sidebar"
        >
          {sidebarCollapsed ? "»" : "«"}
        </button>
      </aside>
    </>
  );
}
