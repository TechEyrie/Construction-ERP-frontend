"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ActionListSkeleton } from "@/components/ui/Skeleton";
import {
  listActionCentre,
  markAllNotificationsRead,
  markNotificationRead,
  type ActionCentreData,
  type NotificationRow
} from "@/lib/api/services/notificationService";
import { listMyProjects, type AssignedProject } from "@/lib/api/services/projectsService";
import { getAccessToken } from "@/lib/auth/session";

const TYPES = [
  "",
  "WIP_SUBMITTED",
  "WIP_CERTIFIED",
  "WIP_RETURNED",
  "INVOICE_SUBMITTED",
  "INVOICE_OVERDUE",
  "INVOICE_APPROVED",
  "INVOICE_REJECTED",
  "PAYMENT_RECORDED",
  "FUNDING_DRAWDOWN_RECORDED",
  "COMPLIANCE_EXPIRING",
  "COMPLIANCE_EXPIRED",
  "PROGRESS_SUBMITTED",
  "PROGRESS_RETURNED",
  "TENDER_AWARDED"
];

function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return "—";
  const m = Math.floor(ms / 60000);
  if (m < 60) return `${Math.max(1, m)}m ago`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function ActionCentrePage() {
  const router = useRouter();
  const search = useSearchParams();
  const [projects, setProjects] = useState<AssignedProject[]>([]);
  const [data, setData] = useState<ActionCentreData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const projectId = search.get("projectId") ?? "";
  const isRead = (search.get("isRead") as "true" | "false" | "all" | null) ?? "all";
  const type = search.get("type") ?? "";
  const severity = (search.get("severity") as "" | "danger" | "warning" | "info") ?? "";

  const setFilter = useCallback(
    (patch: Record<string, string>) => {
      const next = new URLSearchParams(search.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (!v || v === "all") next.delete(k);
        else next.set(k, v);
      }
      router.replace(`/action-centre?${next.toString()}`);
    },
    [router, search]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filters: Parameters<typeof listActionCentre>[0] = { limit: 50 };
      if (projectId) filters.projectId = projectId;
      if (isRead !== "all") filters.isRead = isRead;
      if (type) filters.type = type;
      if (severity) filters.severity = severity;
      const centre = await listActionCentre(filters);
      setData(centre);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load Action Centre.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [projectId, isRead, type, severity]);

  useEffect(() => {
    if (!getAccessToken()) {
      router.replace("/login");
      return;
    }
    void listMyProjects()
      .then(setProjects)
      .catch(() => setProjects([]));
  }, [router]);

  useEffect(() => {
    if (!getAccessToken()) return;
    void load();
  }, [load]);

  async function onRowClick(n: NotificationRow) {
    if (!n.isRead) {
      try {
        await markNotificationRead(n.id);
        setData((prev) =>
          prev
            ? {
                ...prev,
                unreadCount: Math.max(0, prev.unreadCount - 1),
                items: prev.items.map((r) =>
                  r.id === n.id ? { ...r, isRead: true, readAt: new Date().toISOString() } : r
                )
              }
            : prev
        );
      } catch {
        /* still navigate */
      }
    }
    if (n.deepLink) router.push(n.deepLink);
  }

  async function onMarkAll() {
    await markAllNotificationsRead(projectId || undefined);
    await load();
  }

  return (
    <main className="opc-action-centre">
      <p className="opc-action-centre-eyebrow">IN-APP NOTIFICATIONS</p>
      <header className="opc-action-centre-header">
        <h1>Action Centre</h1>
        <button
          type="button"
          className="opc-action-centre-mark"
          data-opc-write="true"
          onClick={() => void onMarkAll()}
        >
          Mark all as read
        </button>
      </header>

      <div className="opc-action-centre-filters">
        <label>
          Project
          <select
            value={projectId}
            onChange={(e) => setFilter({ projectId: e.target.value })}
            aria-label="Filter by project"
          >
            <option value="">All projects</option>
            {projects.map((p) => (
              <option key={p.projectId} value={p.projectId}>
                {p.projectCode ?? p.projectName}
              </option>
            ))}
          </select>
        </label>
        <label>
          Status
          <select
            value={isRead}
            onChange={(e) => setFilter({ isRead: e.target.value })}
            aria-label="Filter by read status"
          >
            <option value="all">All</option>
            <option value="false">Unread</option>
            <option value="true">Read</option>
          </select>
        </label>
        <label>
          Type
          <select
            value={type}
            onChange={(e) => setFilter({ type: e.target.value })}
            aria-label="Filter by type"
          >
            {TYPES.map((t) => (
              <option key={t || "all"} value={t}>
                {t || "All types"}
              </option>
            ))}
          </select>
        </label>
        <label>
          Severity
          <select
            value={severity}
            onChange={(e) => setFilter({ severity: e.target.value })}
            aria-label="Filter by severity"
          >
            <option value="">All</option>
            <option value="danger">Danger</option>
            <option value="warning">Warning</option>
            <option value="info">Info</option>
          </select>
        </label>
      </div>

      {data ? (
        <p className="opc-action-centre-meta">
          Unread: <strong>{data.unreadCount}</strong>
        </p>
      ) : null}

      {error ? (
        <div className="opc-action-centre-error" role="alert">
          <p>Unable to load Action Centre. {error}</p>
          <button type="button" onClick={() => void load()}>
            Retry
          </button>
        </div>
      ) : null}

      {loading ? <ActionListSkeleton rows={5} /> : null}

      {!loading && !error && data && data.items.length === 0 ? (
        <p className="opc-action-centre-empty">
          You&apos;re all caught up. No notifications match these filters.
        </p>
      ) : null}

      {!loading && data && data.items.length > 0 ? (
        <ul className="opc-action-centre-list">
          {data.items.map((n) => (
            <li key={n.id}>
              <button
                type="button"
                className={`opc-action-centre-row${n.isRead ? "" : " opc-action-centre-row--unread"}`}
                onClick={() => void onRowClick(n)}
              >
                {!n.isRead ? <span className="opc-action-centre-pip" aria-hidden /> : null}
                <span className="opc-action-centre-copy">
                  <span className="opc-action-centre-title">{n.title}</span>
                  <span className="opc-action-centre-body">{n.body}</span>
                  <span className="opc-action-centre-tags">
                    <span className={`opc-action-centre-sev opc-action-centre-sev--${n.severity ?? "info"}`}>
                      {n.severity ?? "info"}
                    </span>
                    <span>{n.type.split("_").join(" ")}</span>
                  </span>
                </span>
                <time dateTime={n.createdAt}>{relativeTime(n.createdAt)}</time>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <p className="opc-action-centre-back">
        <Link href="/projects">← Projects</Link>
      </p>
    </main>
  );
}
