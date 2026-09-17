import type { AssignedProject } from "@/lib/api/services/projectsService";

export type WorkspaceSnapshot = {
  projectId: string;
  projects: AssignedProject[];
  current: AssignedProject;
  at: number;
};

const TTL_MS = 5 * 60_000;
const byProject = new Map<string, WorkspaceSnapshot>();
let projectsList: { at: number; items: AssignedProject[] } | null = null;

export function readWorkspace(projectId: string): WorkspaceSnapshot | null {
  const hit = byProject.get(projectId);
  if (!hit) return null;
  if (Date.now() - hit.at > TTL_MS) {
    byProject.delete(projectId);
    return null;
  }
  return hit;
}

export function writeWorkspace(snapshot: WorkspaceSnapshot): void {
  byProject.set(snapshot.projectId, { ...snapshot, at: Date.now() });
}

export function readProjectsList(): AssignedProject[] | null {
  if (!projectsList) return null;
  if (Date.now() - projectsList.at > TTL_MS) {
    projectsList = null;
    return null;
  }
  return projectsList.items;
}

export function writeProjectsList(items: AssignedProject[]): void {
  projectsList = { at: Date.now(), items };
}

export function optimisticProject(projectId: string, role = "Owner"): AssignedProject {
  return {
    projectId,
    projectCode: "…",
    projectName: "Project",
    role
  };
}
