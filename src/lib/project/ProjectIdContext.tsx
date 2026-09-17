"use client";

import { createContext, useContext } from "react";

const ProjectIdContext = createContext<string>("");

export function ProjectIdProvider({
  projectId,
  children
}: {
  projectId: string;
  children: React.ReactNode;
}) {
  return <ProjectIdContext.Provider value={projectId}>{children}</ProjectIdContext.Provider>;
}

/** Prefer context (always set by AppShell) over useParams during SPA pushState nav. */
export function useProjectId(paramId?: string): string {
  const ctx = useContext(ProjectIdContext);
  return paramId || ctx;
}
