"use client";

import Link from "next/link";
import { FormEvent, useCallback, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { DocsModalShell } from "@/components/ui/DocsModalShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge, type BadgeStatus } from "@/components/ui/StatusBadge";
import { isAbortError } from "@/lib/api/abort";
import { listDocuments, type DocumentRow } from "@/lib/api/services/documentsService";
import { listOrganizations, type OrgRow } from "@/lib/api/services/projectsService";
import { TableSkeleton } from "@/components/ui/Skeleton";
import {
  createTender,
  listTenders,
  type TenderRow
} from "@/lib/api/services/tendersService";
import { getSessionUser } from "@/lib/auth/session";
import { useAbortableLoad } from "@/lib/hooks/useAbortableLoad";

type Filter = "all" | "active" | "eval" | "awarded" | "closed";

function badgeStatus(s: string): BadgeStatus {
  const allowed: BadgeStatus[] = ["Draft", "Issued", "Closed", "Evaluated", "Awarded", "Cancelled"];
  return (allowed.includes(s as BadgeStatus) ? s : "Draft") as BadgeStatus;
}

function closingLabel(t: TenderRow): { text: string; warn: boolean } {
  const d = new Date(t.closingDate);
  const text = d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  return { text, warn: t.hoursUntilClose >= 0 && t.hoursUntilClose < 48 };
}

export default function ProjectTendersPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId;
  const user = getSessionUser();
  const canCreate = user?.roles?.some((r) => ["Owner", "SystemAdmin", "Consultant"].includes(r));

  const [rows, setRows] = useState<TenderRow[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [busy, setBusy] = useState(false);
  const [docs, setDocs] = useState<DocumentRow[]>([]);
  const [orgs, setOrgs] = useState<OrgRow[]>([]);

  const [title, setTitle] = useState("Main Works Superstructure & MEP Works");
  const [reference, setReference] = useState("TND-PRJ-A-001");
  const [closing, setClosing] = useState("2026-10-30");
  const [docIds, setDocIds] = useState<string[]>([]);
  const [inviteIds, setInviteIds] = useState<string[]>([]);

  const reload = useCallback(
    async (signal?: AbortSignal) => {
      if (!projectId) return;
      setLoading(true);
      setError(null);
      try {
        setRows(await listTenders(projectId, signal ? { signal } : undefined));
      } catch (e) {
        if (isAbortError(e) || signal?.aborted) return;
        setError((e as Error).message);
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [projectId]
  );

  useAbortableLoad([projectId], async (signal) => {
    await reload(signal);
  });

  async function ensureCreateLookups() {
    if (!projectId) return;
    if (docs.length === 0) {
      void listDocuments(projectId)
        .then((r) => setDocs(r.items))
        .catch(() => undefined);
    }
    if (orgs.length === 0) {
      void listOrganizations()
        .then((rows) => {
          const contractors = rows.filter((o) => o.type === "Contractor");
          setOrgs(contractors);
          if (contractors[0] && inviteIds.length === 0) setInviteIds([contractors[0].id]);
        })
        .catch(() => undefined);
    }
  }

  const filtered = useMemo(() => {
    return rows.filter((t) => {
      if (filter === "all") return true;
      if (filter === "active") return t.status === "Issued";
      if (filter === "eval") return t.status === "Evaluated" || t.status === "Closed";
      if (filter === "awarded") return t.status === "Awarded";
      if (filter === "closed") return t.status === "Closed" || t.status === "Cancelled";
      return true;
    });
  }, [rows, filter]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!projectId) return;
    setBusy(true);
    setError(null);
    try {
      await createTender(projectId, {
        title,
        reference,
        closingDate: new Date(`${closing}T17:00:00.000Z`).toISOString(),
        packageDocumentIds: docIds,
        invitedContractorOrgIds: inviteIds
      });
      setShowCreate(false);
      await reload();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function toggleId(list: string[], id: string, set: (v: string[]) => void) {
    set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  }

  return (
    <div className="opc-tenders">
      <header className="opc-tenders-header">
        <div>
          <h1 className="opc-tenders-h1">Tender Management</h1>
          <p className="opc-tenders-lead">Assemble packages, invite contractors, and lock bids on issue.</p>
        </div>
        {canCreate ? (
          <button
            type="button"
            className="opc-btn opc-btn--primary"
            onClick={() => {
              setShowCreate(true);
              void ensureCreateLookups();
            }}
          >
            New Tender
          </button>
        ) : null}
      </header>

      <div className="opc-tenders-tabs" role="tablist" aria-label="Tender filters">
        {(
          [
            ["all", "All"],
            ["active", "Active (Issued)"],
            ["eval", "Under Evaluation"],
            ["awarded", "Awarded"],
            ["closed", "Closed/Cancelled"]
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={filter === id}
            className={`opc-tenders-tab ${filter === id ? "opc-tenders-tab--active" : ""}`}
            onClick={() => setFilter(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {error ? <p className="opc-tenders-error">{error}</p> : null}
      {loading ? <TableSkeleton rows={5} cols={5} /> : null}

      {!loading && filtered.length === 0 ? (
        <EmptyState
          title="No tenders yet"
          description="Create a draft tender package to invite contractors."
          {...(canCreate
            ? {
                actionLabel: "New Tender",
                onAction: () => {
                  setShowCreate(true);
                  void ensureCreateLookups();
                }
              }
            : {})}
        />
      ) : null}

      {filtered.length > 0 ? (
        <div className="opc-tenders-table-wrap">
          <table className="opc-tenders-table">
            <thead>
              <tr>
                <th>Tender</th>
                <th>Status</th>
                <th>Package</th>
                <th>Invitees</th>
                <th>Closing</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => {
                const close = closingLabel(t);
                return (
                  <tr key={t.id}>
                    <td>
                      <div className="opc-tenders-ref">
                        {t.reference} — {t.title}
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={badgeStatus(t.status)} />
                    </td>
                    <td>
                      <span className="opc-tenders-count">{t.packageDocumentCount} docs</span>
                    </td>
                    <td>
                      <span className="opc-tenders-count">{t.invitedCount} Contractors Invited</span>
                    </td>
                    <td className={close.warn ? "opc-tenders-close--warn" : "opc-tenders-close"}>
                      {close.text}
                    </td>
                    <td>
                      <Link className="opc-tenders-link" href={`/projects/${projectId}/tenders/${t.id}`}>
                        View Package
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}

      {showCreate ? (
        <DocsModalShell
          asForm
          title="New Tender"
          titleId="tender-create-title"
          onSubmit={onCreate}
          onClose={() => setShowCreate(false)}
        >
          <label>
            Title
            <input value={title} onChange={(e) => setTitle(e.target.value)} required minLength={3} />
          </label>
          <label>
            Reference
            <input value={reference} onChange={(e) => setReference(e.target.value)} required />
          </label>
          <label>
            Closing date
            <input type="date" value={closing} onChange={(e) => setClosing(e.target.value)} required />
          </label>
          <fieldset>
            <legend>Package documents</legend>
            {docs.length === 0 ? <p className="opc-tenders-muted">Upload documents first.</p> : null}
            {docs.map((d) => (
              <label key={d.id} className="opc-tenders-check">
                <input
                  type="checkbox"
                  checked={docIds.includes(d.id)}
                  onChange={() => toggleId(docIds, d.id, setDocIds)}
                />
                {d.title} ({d.category})
              </label>
            ))}
          </fieldset>
          <fieldset>
            <legend>Invite contractors</legend>
            {orgs.map((o) => (
              <label key={o.id} className="opc-tenders-check">
                <input
                  type="checkbox"
                  checked={inviteIds.includes(o.id)}
                  onChange={() => toggleId(inviteIds, o.id, setInviteIds)}
                />
                {o.name}
              </label>
            ))}
          </fieldset>
          <div className="opc-docs-modal-actions">
            <button type="button" className="opc-btn opc-btn--ghost" onClick={() => setShowCreate(false)}>
              Cancel
            </button>
            <button type="submit" className="opc-btn opc-btn--primary" disabled={busy}>
              {busy ? "Saving…" : "Create Draft"}
            </button>
          </div>
        </DocsModalShell>
      ) : null}
    </div>
  );
}
