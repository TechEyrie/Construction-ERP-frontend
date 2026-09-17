import { getSessionUser } from "./session";

/** Client-side role check — never a security boundary (Law 5). */
export function sessionHasRole(...roles: string[]): boolean {
  const u = getSessionUser();
  if (!u) return false;
  return roles.some((r) => u.roles.includes(r));
}

export function projectUnauthorizedPath(projectId: string): string {
  return `/projects/${projectId}/unauthorized`;
}
