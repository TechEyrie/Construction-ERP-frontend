"use client";

import { useParams, usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { projectUnauthorizedPath } from "@/lib/auth/guards";
import { getAccessToken, getSessionUser, isAccessTokenExpired } from "@/lib/auth/session";
import {
  checkProjectAccess,
  listMyProjects,
  type AssignedProject
} from "@/lib/api/services/projectsService";
import {
  optimisticProject,
  readProjectsList,
  readWorkspace,
  writeProjectsList,
  writeWorkspace
} from "@/lib/project/workspaceCache";

type Props = { children: React.ReactNode };

function initialProjects(projectId: string): AssignedProject[] {
  const cached = readWorkspace(projectId);
  if (cached) return cached.projects;
  const list = readProjectsList();
  if (list?.length) return list;
  return [optimisticProject(projectId, "Owner")];
}

function initialCurrent(projectId: string): AssignedProject {
  const cached = readWorkspace(projectId);
  if (cached) return cached.current;
  return optimisticProject(projectId, "Owner");
}

/**
 * Instant shell: never block sidebar navigation on network.
 * SSR + first client paint share the same optimistic shell (no hydration mismatch).
 * Access + project list revalidate in the background.
 */
export default function ProjectLayout({ children }: Props) {
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId ?? "";
  const pathname = usePathname();
  const router = useRouter();
  const isUnauthorizedRoute = pathname?.endsWith("/unauthorized");

  const [projects, setProjects] = useState<AssignedProject[]>(() =>
    projectId ? initialProjects(projectId) : []
  );
  const [current, setCurrent] = useState<AssignedProject>(() =>
    projectId ? initialCurrent(projectId) : optimisticProject("", "Owner")
  );

  useEffect(() => {
    if (!projectId || isUnauthorizedRoute) return;

    if (!getAccessToken() || isAccessTokenExpired()) {
      router.replace("/login");
      return;
    }

    let cancelled = false;
    const roleGuess = getSessionUser()?.roles?.[0] ?? "Owner";

    const cached = readWorkspace(projectId);
    if (cached) {
      setProjects(cached.projects);
      setCurrent(cached.current);
    } else {
      setCurrent((prev) =>
        prev.projectId === projectId ? prev : optimisticProject(projectId, roleGuess)
      );
    }

    const ac = new AbortController();

    void (async () => {
      const access = await checkProjectAccess(projectId, { signal: ac.signal }).catch(() => null);
      if (cancelled || ac.signal.aborted) return;
      if (!access?.hasAccess) {
        router.replace(projectUnauthorizedPath(projectId));
        return;
      }

      let list = readProjectsList();
      if (!list) {
        list = await listMyProjects({ signal: ac.signal }).catch(() => [] as AssignedProject[]);
        if (list.length) writeProjectsList(list);
      }
      if (cancelled || ac.signal.aborted) return;

      const nextCurrent =
        list.find((p) => p.projectId === projectId) ??
        ({
          projectId,
          projectCode: list[0]?.projectCode ?? "—",
          projectName: list[0]?.projectName ?? "Project",
          role: access.assignedRole
        } satisfies AssignedProject);

      const withRole = { ...nextCurrent, role: access.assignedRole };
      const nextProjects = list.length ? list : [withRole];
      setProjects(nextProjects);
      setCurrent(withRole);
      writeWorkspace({ projectId, projects: nextProjects, current: withRole, at: Date.now() });
    })();

    return () => {
      cancelled = true;
      ac.abort();
    };
  }, [projectId, isUnauthorizedRoute, router]);

  if (isUnauthorizedRoute || !projectId) {
    return <>{children}</>;
  }

  return (
    <AppShell projectId={projectId} projects={projects} current={current}>
      {children}
    </AppShell>
  );
}
