"use client";

import { useParams } from "next/navigation";

/** Stub module surface until domain READMEs land. */
export default function ProjectModuleStubPage() {
  const params = useParams<{ projectId: string; section: string }>();
  return (
    <div className="opc-project-dash">
      <h1 className="opc-project-dash-title">{params.section}</h1>
      <p className="opc-project-dash-lead">Module stub — implement in later README.</p>
    </div>
  );
}
