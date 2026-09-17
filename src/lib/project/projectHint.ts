import type { AssignedProject } from "@/lib/api/services/projectsService";

/** Latest project from AppShell — so dashboard can paint the real name before API returns. */
let hint: AssignedProject | null = null;

export function setProjectHint(project: AssignedProject): void {
  hint = project;
}

export function getProjectHint(projectId: string): AssignedProject | null {
  if (!hint || hint.projectId !== projectId) return null;
  return hint;
}
