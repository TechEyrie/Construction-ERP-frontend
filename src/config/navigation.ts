/** Project sidebar nav — README_12. Roles match API UserRole strings. */

export type ProjectRole = "SystemAdmin" | "Owner" | "Consultant" | "Contractor" | "Finance";

export interface NavItem {
  id: string;
  label: string;
  pathSuffix: string;
  /** Short label for icon-only / bottom bar */
  shortLabel: string;
  allowedRoles: ProjectRole[];
}

export const PROJECT_NAV_ITEMS: NavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    pathSuffix: "",
    shortLabel: "Home",
    allowedRoles: ["SystemAdmin", "Owner", "Consultant", "Contractor", "Finance"]
  },
  {
    id: "documents",
    label: "Documents",
    pathSuffix: "/documents",
    shortLabel: "Docs",
    allowedRoles: ["SystemAdmin", "Owner", "Consultant", "Contractor", "Finance"]
  },
  {
    id: "tenders",
    label: "Tenders",
    pathSuffix: "/tenders",
    shortLabel: "Tenders",
    allowedRoles: ["SystemAdmin", "Owner", "Consultant", "Contractor"]
  },
  {
    id: "contracts",
    label: "Contracts",
    pathSuffix: "/contracts",
    shortLabel: "Contracts",
    allowedRoles: ["SystemAdmin", "Owner", "Consultant", "Contractor", "Finance"]
  },
  {
    id: "boq",
    label: "Bill of Quantities",
    pathSuffix: "/boq",
    shortLabel: "BOQ",
    allowedRoles: ["SystemAdmin", "Owner", "Consultant", "Contractor", "Finance"]
  },
  {
    id: "progress",
    label: "Site Progress",
    pathSuffix: "/progress",
    shortLabel: "Progress",
    allowedRoles: ["SystemAdmin", "Owner", "Consultant", "Contractor", "Finance"]
  },
  {
    id: "wips",
    label: "WIP & Valuation",
    pathSuffix: "/wips",
    shortLabel: "WIP",
    allowedRoles: ["SystemAdmin", "Owner", "Consultant", "Contractor", "Finance"]
  },
  {
    id: "invoices",
    label: "Invoices",
    pathSuffix: "/invoices",
    shortLabel: "Invoices",
    allowedRoles: ["SystemAdmin", "Owner", "Consultant", "Contractor", "Finance"]
  },
  {
    id: "payments",
    label: "Payments",
    pathSuffix: "/payments",
    shortLabel: "Pay",
    allowedRoles: ["SystemAdmin", "Owner", "Finance"]
  },
  {
    id: "funding",
    label: "Bank Funding",
    pathSuffix: "/funding",
    shortLabel: "Funding",
    allowedRoles: ["SystemAdmin", "Owner", "Finance"]
  },
  {
    id: "compliance",
    label: "Compliance",
    pathSuffix: "/compliance",
    shortLabel: "Compliance",
    allowedRoles: ["SystemAdmin", "Owner", "Consultant", "Contractor"]
  },
  {
    id: "reports",
    label: "Reports & Exports",
    pathSuffix: "/reports",
    shortLabel: "Reports",
    allowedRoles: ["SystemAdmin", "Owner", "Consultant", "Finance"]
  }
  // ponytail: Project Setup nav hidden — catch-all still stubs /settings; re-enable when settings UI ships
];

/** Bottom bar shortcuts (mobile). */
export const MOBILE_QUICK_NAV_IDS = ["dashboard", "progress", "wips", "invoices"] as const;

export function filterNavForRole(role: string, items: NavItem[] = PROJECT_NAV_ITEMS): NavItem[] {
  return items.filter((i) => i.allowedRoles.includes(role as ProjectRole));
}

export function projectPath(projectId: string, pathSuffix: string): string {
  return `/projects/${projectId}${pathSuffix}`;
}

/** Preserve module suffix when switching projects (BR-02). */
export function switchProjectPath(pathname: string, fromId: string, toId: string): string {
  const prefix = `/projects/${fromId}`;
  if (!pathname.startsWith(prefix)) return `/projects/${toId}`;
  const rest = pathname.slice(prefix.length);
  if (rest === "/unauthorized") return `/projects/${toId}`;
  return `/projects/${toId}${rest}`;
}
