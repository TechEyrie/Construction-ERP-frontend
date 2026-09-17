"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { TenderPackageViewer, type PackageDoc } from "@/components/tenders/TenderPackageViewer";
import { DocsModalShell } from "@/components/ui/DocsModalShell";
import { StatusBadge, type BadgeStatus } from "@/components/ui/StatusBadge";
import { listDocuments } from "@/lib/api/services/documentsService";
import { listOrganizations, type OrgRow } from "@/lib/api/services/projectsService";
import { DetailSkeleton } from "@/components/ui/Skeleton";
import {
  cancelTender,
  closeTender,
  getTender,
  issueTender,
  type TenderRow
} from "@/lib/api/services/tendersService";
import { getSessionUser } from "@/lib/auth/session";

function badgeStatus(s: string): BadgeStatus {
  const allowed: BadgeStatus[] = ["Draft", "Issued", "Closed", "Evaluated", "Awarded", "Cancelled"];
  return (allowed.includes(s as BadgeStatus) ? s : "Draft") as BadgeStatus;
}

export default function TenderDetailPage() {
  const params = useParams<{ projectId: string; tenderId: string }>();
  const projectId = params.projectId;
  const tenderId = params.tenderId;
  const user = getSessionUser();
  const canIssue = user?.roles?.some((r) => ["Owner", "SystemAdmin"].includes(r));
  const canCompare = user?.roles?.some((r) => ["Owner", "SystemAdmin", "Consultant"].includes(r));
  const isContractor = user?.roles?.includes("Contractor");

  const [tender, setTender] = useState<TenderRow | null>(null);
  const [pkg, setPkg] = useState<PackageDoc[]>([]);
  const [invitees, setInvitees] = useState<OrgRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState("");

  const reload = useCallback(async () => {
    if (!projectId || !tenderId) return;
    setError(null);
    try {
      const t = await getTender(projectId, tenderId);
      setTender(t);
      const [docs, orgs] = await Promise.all([
        listDocuments(projectId).then((r) => r.items).catch(() => [] as Awaited<ReturnType<typeof listDocuments>>["items"]),
        listOrganizations().catch(() => [] as OrgRow[])
      ]);
      const byId = new Map(docs.map((d) => [d.id, d]));
      setPkg(
        t.packageDocumentIds.map((id) => {
          const d = byId.get(id);
          const row: PackageDoc = { id, title: d?.title ?? id };
          if (d?.category) row.category = d.category;
          if (d?.revision) row.revision = d.revision;
          return row;
        })
      );
      setInvitees(orgs.filter((o: OrgRow) => t.invitedContractorOrgIds.includes(o.id)));
    } catch (e) {
      setError((e as Error).message);
    }
  }, [projectId, tenderId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function onIssue() {
    if (!projectId || !tenderId) return;
    setBusy(true);
    setError(null);
    try {
      setTender(await issueTender(projectId, tenderId));
      await reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function onClose() {
    if (!projectId || !tenderId) return;
    setBusy(true);
    try {
      setTender(await closeTender(projectId, tenderId));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function onCancel(e: FormEvent) {
    e.preventDefault();
    if (!projectId || !tenderId) return;
    setBusy(true);
    try {
      setTender(await cancelTender(projectId, tenderId, reason));
      setCancelOpen(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (!tender && !error) return <DetailSkeleton />;
  if (!tender) return <p className="opc-tenders-error">{error}</p>;

  const locked = tender.status !== "Draft";

  return (
    <div className="opc-tenders opc-tender-detail">
      <p className="opc-tenders-back">
        <Link href={`/projects/${projectId}/tenders`}>← Tender list</Link>
      </p>
      <header className="opc-tenders-header">
        <div>
          <p className="opc-tenders-code">{tender.reference}</p>
          <h1 className="opc-tenders-h1">{tender.title}</h1>
          <StatusBadge status={badgeStatus(tender.status)} size="md" />
        </div>
        {canIssue ? (
          <div className="opc-tenders-actions">
            {tender.status === "Draft" ? (
              <button type="button" className="opc-btn opc-btn--gold" disabled={busy} onClick={() => void onIssue()}>
                Issue Tender Package
              </button>
            ) : null}
            {tender.status === "Issued" ? (
              <button type="button" className="opc-btn opc-btn--primary" disabled={busy} onClick={() => void onClose()}>
                Close Bidding
              </button>
            ) : null}
            {tender.status !== "Cancelled" && tender.status !== "Awarded" ? (
              <button type="button" className="opc-btn opc-tender-cancel" onClick={() => setCancelOpen(true)}>
                Cancel Tender
              </button>
            ) : null}
          </div>
        ) : null}
      </header>

      <div className="opc-tenders-actions" style={{ marginBottom: "1rem" }}>
        {canCompare ? (
          <Link className="opc-btn opc-btn--primary" href={`/projects/${projectId}/tenders/${tenderId}/compare`}>
            Side-by-Side Comparison
          </Link>
        ) : null}
        {isContractor ? (
          <Link className="opc-btn opc-btn--gold" href={`/projects/${projectId}/tenders/${tenderId}/my-bid`}>
            My Bid
          </Link>
        ) : null}
      </div>

      {error ? <p className="opc-tenders-error">{error}</p> : null}

      <section className="opc-tender-panel">
        <h2>Package Documents{locked ? " (locked)" : ""}</h2>
        <TenderPackageViewer docs={pkg} locked={locked} />
      </section>

      <section className="opc-tender-panel">
        <h2>Invited Contractors</h2>
        {invitees.length === 0 ? (
          <p className="opc-tenders-muted">No invitees.</p>
        ) : (
          <ul className="opc-tender-invitees">
            {invitees.map((o) => (
              <li key={o.id}>
                <strong>{o.name}</strong>
                <span>{o.type}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <dl className="opc-tender-meta">
        <div>
          <dt>Closing</dt>
          <dd>{new Date(tender.closingDate).toLocaleString()}</dd>
        </div>
        <div>
          <dt>Issued</dt>
          <dd>{tender.issueDate ? new Date(tender.issueDate).toLocaleString() : "—"}</dd>
        </div>
        {tender.cancellationReason ? (
          <div>
            <dt>Cancellation reason</dt>
            <dd>{tender.cancellationReason}</dd>
          </div>
        ) : null}
      </dl>

      {cancelOpen ? (
        <DocsModalShell
          asForm
          title="Cancel tender"
          ariaLabel="Cancel tender"
          onSubmit={onCancel}
          onClose={() => setCancelOpen(false)}
        >
          <label>
            Reason (min 10 characters)
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} required minLength={10} rows={4} />
          </label>
          <div className="opc-docs-modal-actions">
            <button type="button" className="opc-btn opc-btn--ghost" onClick={() => setCancelOpen(false)}>
              Back
            </button>
            <button type="submit" className="opc-btn opc-tender-cancel" disabled={busy}>
              Confirm cancel
            </button>
          </div>
        </DocsModalShell>
      ) : null}
    </div>
  );
}
