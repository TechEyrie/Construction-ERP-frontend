"use client";

import type { AuditLogRow } from "@/lib/api/services/auditService";
import { Skeleton } from "@/components/ui/Skeleton";

type Props = {
  items: AuditLogRow[] | null;
  loading?: boolean;
  error?: string | null;
};

function badgeTone(action: string): "approved" | "success" | "danger" {
  const a = action.toUpperCase();
  if (a.includes("DELETE") || a.includes("DENIED") || a.includes("ARCHIVE")) return "danger";
  if (a.includes("PAYMENT") || a.includes("POST") || a.includes("UPLOADED")) return "success";
  return "approved";
}

function timeLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
}

/** AC-08: project activity timeline with design tokens. */
export function ProjectActivityTimeline({ items, loading, error }: Props) {
  if (loading) {
    return (
      <ol className="opc-timeline" aria-busy="true" aria-label="Loading activity">
        {Array.from({ length: 5 }).map((_, i) => (
          <li key={i} className="opc-timeline-row opc-timeline-skel" style={{ animationDelay: `${i * 50}ms` }}>
            <Skeleton width="3.2rem" height="0.7rem" />
            <Skeleton width="6rem" height="1.1rem" radius="sm" />
            <Skeleton width="8rem" height="0.75rem" />
            <Skeleton width="40%" height="0.75rem" />
            <Skeleton width="5rem" height="0.7rem" />
          </li>
        ))}
      </ol>
    );
  }

  if (error) {
    return (
      <div className="opc-timeline-empty" role="alert">
        {error}
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="opc-timeline-empty">No recent activity recorded for this project</div>
    );
  }

  return (
    <ol className="opc-timeline" aria-label="Project activity">
      {items.map((row) => {
        const tone = badgeTone(row.action);
        return (
          <li key={row.id} className="opc-timeline-row">
            <time className="opc-timeline-time" dateTime={row.createdAt}>
              {timeLabel(row.createdAt)}
            </time>
            <span className={`opc-timeline-badge opc-timeline-badge-${tone}`}>{row.action}</span>
            <span className="opc-timeline-actor">
              {row.actor.name} <span className="opc-timeline-role">({row.actor.role})</span>
            </span>
            <span className="opc-timeline-desc">
              {row.diffSummary ?? `${row.entityType} · ${row.entityId.slice(-6)}`}
            </span>
            <code className="opc-timeline-id">#{row.id.slice(0, 10)}…</code>
          </li>
        );
      })}
    </ol>
  );
}
