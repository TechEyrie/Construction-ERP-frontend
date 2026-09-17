"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getSessionUser } from "@/lib/auth/session";

export default function ProjectUnauthorizedPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId ?? "—";
  const user = getSessionUser();
  const [ts, setTs] = useState("—");

  useEffect(() => {
    setTs(new Date().toISOString());
  }, []);

  return (
    <main className="opc-denied">
      <div className="opc-denied-card">
        <p className="opc-denied-eyebrow">ACCESS RESTRICTED</p>
        <h1>Project Access Denied</h1>
        <p className="opc-denied-body">
          Your account does not possess membership permissions for project code [{projectId}]. If you
          believe this is an error, contact your Organization Administrator or Project Owner.
        </p>
        <div className="opc-denied-meta">
          <div>User ID: {user?.id ?? "—"}</div>
          <div>Project ID: {projectId}</div>
          <div>Timestamp: {ts}</div>
        </div>
        <Link className="opc-denied-cta" href="/">
          Return to Portfolio
        </Link>
      </div>
    </main>
  );
}
