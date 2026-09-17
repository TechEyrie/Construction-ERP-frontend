"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import type { AssignedProject } from "@/lib/api/services/projectsService";
import { switchProjectPath } from "@/config/navigation";
import { setProjectSelectorOpen } from "@/lib/shell/shellState";
import { useShellState } from "@/lib/shell/useShellState";

type Props = {
  projectId: string;
  projects: AssignedProject[];
  current?: AssignedProject;
};

export function ProjectSelector({ projectId, projects, current }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const { projectSelectorOpen: open } = useShellState();
  const rootRef = useRef<HTMLDivElement>(null);
  const single = projects.length <= 1;

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setProjectSelectorOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  function select(p: AssignedProject) {
    setProjectSelectorOpen(false);
    if (p.projectId === projectId) return;
    console.info(
      JSON.stringify({
        event: "PROJECT_CONTEXT_SWITCHED",
        previousProjectId: projectId,
        newProjectId: p.projectId,
        timestamp: new Date().toISOString()
      })
    );
    router.push(switchProjectPath(pathname, projectId, p.projectId));
  }

  if (!current) {
    return <span className="opc-psel-static">No project</span>;
  }

  if (single) {
    return (
      <div className="opc-psel opc-psel--static" data-single="true">
        <span className="opc-psel-name">{current.projectName}</span>
        <span className="opc-psel-code">{current.projectCode}</span>
        <span className="opc-psel-role">Role: {current.role}</span>
      </div>
    );
  }

  return (
    <div className="opc-psel" ref={rootRef}>
      <button
        type="button"
        className="opc-psel-trigger"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setProjectSelectorOpen(!open)}
      >
        <span className="opc-psel-name">{current.projectName}</span>
        <span className="opc-psel-code">{current.projectCode}</span>
        <span className="opc-psel-role">Role: {current.role}</span>
        <span className="opc-psel-chevron" aria-hidden>
          ▾
        </span>
      </button>
      {open ? (
        <ul className="opc-psel-menu" role="listbox">
          {projects.map((p) => (
            <li key={p.projectId} role="option" aria-selected={p.projectId === projectId}>
              <button type="button" className="opc-psel-item" onClick={() => select(p)}>
                <span>{p.projectName}</span>
                <span className="opc-psel-code">{p.projectCode}</span>
              </button>
            </li>
          ))}
          <li>
            <Link className="opc-psel-item opc-psel-item--muted" href="/projects" onClick={() => setProjectSelectorOpen(false)}>
              All projects
            </Link>
          </li>
        </ul>
      ) : null}
    </div>
  );
}
