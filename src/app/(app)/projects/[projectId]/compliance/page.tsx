"use client";

import { FormEvent, useCallback, useState } from "react";
import { useParams } from "next/navigation";
import { ComplianceStatusBadge } from "@/components/compliance/ComplianceStatusBadge";
import { FileUploadZone } from "@/components/files/FileUploadZone";
import { EmptyState } from "@/components/ui/EmptyState";
import { DocsModalShell } from "@/components/ui/DocsModalShell";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { isAbortError } from "@/lib/api/abort";
import {
  addComplianceDocument,
  getComplianceSummary,
  type ComplianceSummary
} from "@/lib/api/services/complianceService";
import { uploadProjectDocument } from "@/lib/api/services/documentsService";
import { useAbortableLoad } from "@/lib/hooks/useAbortableLoad";

function toIso(d: string): string {
  return new Date(`${d}T12:00:00.000Z`).toISOString();
}

function fmt(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

export default function ProjectCompliancePage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId;
  const [summary, setSummary] = useState<ComplianceSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [orgId, setOrgId] = useState("");
  const [type, setType] = useState("TradeLicence");
  const [documentNumber, setDocumentNumber] = useState("");
  const [issueDate, setIssueDate] = useState("2025-10-01");
  const [expiryDate, setExpiryDate] = useState("2026-10-01");
  const [busy, setBusy] = useState(false);

  const reload = useCallback(
    async (signal?: AbortSignal) => {
      if (!projectId) return;
      setLoading(true);
      setError(null);
      try {
        const s = await getComplianceSummary(projectId, signal ? { signal } : undefined);
        if (signal?.aborted) return;
        setSummary(s);
        if (!orgId && s.stakeholderBreakdown[0]) {
          setOrgId(s.stakeholderBreakdown[0].organizationId);
        }
      } catch (e) {
        if (isAbortError(e) || signal?.aborted) return;
        setError((e as Error).message);
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [projectId, orgId]
  );

  useAbortableLoad([projectId], async (signal) => {
    await reload(signal);
  });

  async function onSubmitMeta(e: FormEvent) {
    e.preventDefault();
    // upload happens via FileUploadZone
  }

  const rows = summary?.stakeholderBreakdown.flatMap((s) =>
    s.documents.map((d) => ({ ...d, orgName: s.organizationName, role: s.role }))
  );

  return (
    <div className="opc-compliance">
      <header className="opc-compliance-header">
        <div>
          <h1 className="opc-compliance-h1">Compliance</h1>
          <p className="opc-compliance-lead">
            Query-time licence status for contractor and consultant stakeholders.
          </p>
        </div>
        <button type="button" className="opc-btn opc-btn--primary" onClick={() => setShowAdd(true)}>
          Add Compliance Document
        </button>
      </header>

      {error ? (
        <p className="opc-auth-error" role="alert">
          {error}
        </p>
      ) : null}

      {loading ? (
        <TableSkeleton rows={5} cols={5} />
      ) : (
        <>
      {summary ? (
        <div className="opc-compliance-kpis">
          <article className="opc-compliance-kpi">
            <p className="opc-compliance-kpi-eyebrow">Valid</p>
            <p className="opc-compliance-kpi-value opc-compliance-kpi-value--ok">{summary.validCount}</p>
          </article>
          <article className="opc-compliance-kpi">
            <p className="opc-compliance-kpi-eyebrow">Expiring Soon</p>
            <p className="opc-compliance-kpi-value opc-compliance-kpi-value--warn">
              {summary.expiringSoonCount}
            </p>
          </article>
          <article className="opc-compliance-kpi">
            <p className="opc-compliance-kpi-eyebrow">Expired</p>
            <p className="opc-compliance-kpi-value opc-compliance-kpi-value--danger">
              {summary.expiredCount}
            </p>
          </article>
        </div>
      ) : null}

      {summary?.hasAttentionItems ? (
        <div className="opc-compliance-attention" role="status">
          Attention required — one or more stakeholder licences are expired or expiring soon.
        </div>
      ) : null}

      {!rows || rows.length === 0 ? (
        <EmptyState
          title="No compliance documents"
          description="Upload CR, trade licence, or insurance PDFs for project stakeholders."
          actionLabel="Add Compliance Document"
          onAction={() => setShowAdd(true)}
        />
      ) : (
        <div className="opc-compliance-table-wrap">
          <table className="opc-compliance-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Number</th>
                <th>Organization</th>
                <th>Dates</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.type}</td>
                  <td className="opc-compliance-num">{r.documentNumber}</td>
                  <td>
                    {r.orgName}
                    <span className="opc-compliance-role"> · {r.role}</span>
                  </td>
                  <td className="opc-compliance-num">
                    {fmt(r.issueDate)} → {fmt(r.expiryDate)}
                  </td>
                  <td>
                    <ComplianceStatusBadge status={r.computedStatus} daysRemaining={r.daysRemaining} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
        </>
      )}

      {showAdd ? (
        <DocsModalShell
          asForm
          title="Add Compliance Document"
          ariaLabel="Add compliance"
          onSubmit={(e) => void onSubmitMeta(e)}
          onClose={() => setShowAdd(false)}
        >
          <label>
            Organization
            <select value={orgId} onChange={(e) => setOrgId(e.target.value)} required>
              {(summary?.stakeholderBreakdown ?? []).map((s) => (
                <option key={s.organizationId} value={s.organizationId}>
                  {s.organizationName} ({s.role})
                </option>
              ))}
            </select>
          </label>
          <label>
            Type
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="CR">CR</option>
              <option value="TradeLicence">TradeLicence</option>
              <option value="Insurance">Insurance</option>
            </select>
          </label>
          <label>
            Document number
            <input
              value={documentNumber}
              onChange={(e) => setDocumentNumber(e.target.value)}
              required
              minLength={3}
            />
          </label>
          <label>
            Issue date
            <input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} required />
          </label>
          <label>
            Expiry date
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              required
            />
          </label>
          <FileUploadZone
            disabled={busy || !orgId || documentNumber.trim().length < 3}
            onFile={async (file) => {
              setBusy(true);
              setError(null);
              try {
                const doc = await uploadProjectDocument({
                  projectId,
                  file,
                  category: "Compliance",
                  title: `${type} ${documentNumber}`.slice(0, 150)
                });
                await addComplianceDocument(orgId, {
                  type,
                  documentNumber: documentNumber.trim(),
                  issueDate: toIso(issueDate),
                  expiryDate: toIso(expiryDate),
                  attachmentDocumentId: doc.id
                });
                setShowAdd(false);
                setDocumentNumber("");
                await reload();
              } catch (err) {
                setError((err as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          />
          <div className="opc-docs-modal-actions">
            <button type="button" className="opc-docs-action" onClick={() => setShowAdd(false)}>
              Cancel
            </button>
          </div>
        </DocsModalShell>
      ) : null}
    </div>
  );
}
