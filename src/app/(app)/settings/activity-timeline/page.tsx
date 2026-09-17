"use client";

import { useState } from "react";
import { ProjectActivityTimeline } from "@/components/audit/ProjectActivityTimeline";
import {
  listProjectAuditLogs,
  type AuditLogRow
} from "@/lib/api/services/auditService";
import { getAccessToken } from "@/lib/auth/session";

/** Demo surface for README_09 ProjectActivityTimeline (AC-08). */
export default function ActivityTimelineDemoPage() {
  const [projectId, setProjectId] = useState("");
  const [items, setItems] = useState<AuditLogRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const authed = Boolean(getAccessToken());

  async function load() {
    if (projectId.length !== 24) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await listProjectAuditLogs(projectId, { limit: 20 });
      setItems(data);
    } catch (e) {
      setItems([]);
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  const demoRows: AuditLogRow[] = [
    {
      id: "01J7JAA1234567890abcde",
      actor: { id: "a1", name: "David Sterling", role: "Consultant" },
      entityType: "WIP",
      entityId: "66e6fa0a4b0811e289000010",
      action: "STATUS_CHANGE",
      diffSummary: "WIP #01 status changed from UnderReview to Certified",
      ip: "192.168.1.25",
      createdAt: "2026-09-15T14:32:00.000Z"
    },
    {
      id: "01J7JAB1234567890fghij",
      actor: { id: "a2", name: "Finance Desk", role: "Finance" },
      entityType: "Payment",
      entityId: "66e6fa0a4b0811e289000020",
      action: "PAYMENT_POSTED",
      diffSummary: "Payment posted QAR 120,000.00",
      ip: "10.0.0.2",
      createdAt: "2026-09-15T14:32:00.000Z"
    },
    {
      id: "01J7JAC1234567890klmno",
      actor: { id: "a3", name: "System", role: "SystemAdmin" },
      entityType: "Document",
      entityId: "66e6fa0a4b0811e289000030",
      action: "FILE_SOFT_DELETED",
      diffSummary: "Document archived",
      ip: "10.0.0.1",
      createdAt: "2026-09-15T14:32:00.000Z"
    }
  ];

  return (
    <main className="opc-admin">
      <p className="opc-admin-crumb">System / Activity Timeline</p>
      <header className="opc-admin-header">
        <h1>Project Activity</h1>
      </header>

      {!authed ? (
        <div className="opc-api-status-banner opc-api-status-banner-error">
          <span className="opc-pill opc-pill-danger">Sign in to load live audit logs</span>
        </div>
      ) : null}

      <form
        className="opc-admin-form"
        onSubmit={(e) => {
          e.preventDefault();
          void load();
        }}
      >
        <label>
          Project ID
          <input
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            placeholder="24-char ObjectId"
          />
        </label>
        <button type="submit" disabled={!authed || projectId.length !== 24}>
          Load timeline
        </button>
      </form>

      <section className="opc-timeline-panel" aria-label="Live timeline">
        <h2 className="opc-timeline-heading">Live</h2>
        <ProjectActivityTimeline items={items} loading={loading} error={error} />
      </section>

      <section className="opc-timeline-panel" aria-label="Design preview">
        <h2 className="opc-timeline-heading">Token preview (AC-08)</h2>
        <ProjectActivityTimeline items={demoRows} />
      </section>
    </main>
  );
}
