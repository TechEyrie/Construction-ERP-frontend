"use client";

import { useCallback, useState } from "react";
import { useParams } from "next/navigation";
import { BoqImportWizard } from "@/components/boq/BoqImportWizard";
import { BoqTreeTable } from "@/components/boq/BoqTreeTable";
import { LockBaselineModal } from "@/components/boq/LockBaselineModal";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { isAbortError } from "@/lib/api/abort";
import {
  getBoqSummary,
  getBoqTree,
  listBoqItems,
  type BoqItemRow,
  type BoqSummary,
  type BoqTreeNode
} from "@/lib/api/services/boqService";
import { getSessionUser } from "@/lib/auth/session";
import { useAbortableLoad } from "@/lib/hooks/useAbortableLoad";

function money(qar: string): string {
  const n = Number(qar);
  return Number.isFinite(n)
    ? `QAR ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : `QAR ${qar}`;
}

export default function ProjectBoqPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId;
  const user = getSessionUser();
  const canManage = user?.roles?.some((r) => ["Owner", "SystemAdmin", "Consultant"].includes(r));

  const [summary, setSummary] = useState<BoqSummary | null>(null);
  const [tree, setTree] = useState<BoqTreeNode[]>([]);
  const [flat, setFlat] = useState<BoqItemRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [lockOpen, setLockOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(
    async (signal?: AbortSignal) => {
      if (!projectId) return;
      setError(null);
      setLoading(true);
      try {
        const init = signal ? { signal } : undefined;
        const [s, t] = await Promise.all([
          getBoqSummary(projectId, init),
          getBoqTree(projectId, init)
        ]);
        if (signal?.aborted) return;
        setSummary(s);
        setTree(t);
        if (t.length === 0 && (s.totalItemCount ?? 0) > 0) {
          setFlat(await listBoqItems(projectId, init));
        } else {
          setFlat([]);
        }
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

  const locked = Boolean(summary?.isBaselineLocked);

  return (
    <div className="opc-boq">
      <header className="opc-boq-page-head">
        <div>
          <h1 className="opc-boq-h1">Bill of Quantities</h1>
          <p className="opc-boq-lead">WBS, draft edits, and irreversible baseline lock.</p>
        </div>
        {summary ? (
          <span className={locked ? "opc-boq-badge opc-boq-badge--locked" : "opc-boq-badge"}>
            {locked
              ? `Baseline Locked — ${summary.baselineLockedAt ? new Date(summary.baselineLockedAt).toLocaleDateString() : ""}`
              : "Draft BOQ (Unlocked)"}
          </span>
        ) : null}
      </header>

      {flash ? (
        <p className="opc-boq-banner opc-boq-banner--ok" role="status">
          {flash}
        </p>
      ) : null}
      {error ? <p className="opc-tenders-error">{error}</p> : null}

      {loading ? (
        <TableSkeleton rows={8} cols={5} />
      ) : (
        <>
      {summary ? (
        <div className="opc-boq-metrics">
          <div className="opc-boq-metric">
            <span>Total BOQ</span>
            <strong>{money(summary.totalBoqAmount)}</strong>
          </div>
          <div className="opc-boq-metric opc-boq-metric--gold">
            <span>Contract Value</span>
            <strong>{money(summary.contractValue)}</strong>
          </div>
          <div className={`opc-boq-metric${summary.hasContractValueMismatch ? " opc-boq-metric--warn" : ""}`}>
            <span>Variance</span>
            <strong>
              {money(summary.varianceAmount)} ({summary.variancePercentage}%)
            </strong>
          </div>
          <div className="opc-boq-metric">
            <span>WBS</span>
            <strong>
              {summary.totalItemCount} items · {summary.leafItemCount} leaf
            </strong>
          </div>
        </div>
      ) : null}

      {summary?.hasContractValueMismatch && !locked ? (
        <p className="opc-boq-banner opc-boq-banner--warn" role="status">
          Warning: BOQ Total ({money(summary.totalBoqAmount)}) differs from Contract Value (
          {money(summary.contractValue)}) by {money(summary.varianceAmount)} (+{summary.variancePercentage}%).
          Variance will be recorded in the audit trail upon baseline lock.
        </p>
      ) : null}

      {canManage && !locked && projectId ? (
        <div className="opc-boq-toolbar">
          <button type="button" className="opc-btn opc-btn--primary" onClick={() => setLockOpen(true)}>
            Lock Baseline
          </button>
        </div>
      ) : null}

      {projectId ? (
        <section className="opc-boq-list">
          <h2 className="opc-boq-h2">WBS tree</h2>
          <BoqTreeTable
            projectId={projectId}
            nodes={tree}
            locked={locked}
            canEdit={Boolean(canManage)}
            onChanged={() => void reload()}
          />
        </section>
      ) : null}

      {canManage && !locked && projectId ? (
        <BoqImportWizard
          projectId={projectId}
          onCommitted={() => {
            setFlash("BOQ import committed.");
            void reload();
          }}
        />
      ) : null}

      {!locked && flat.length > 0 && tree.length === 0 ? (
        <p className="opc-tenders-muted">Flat draft lines present ({flat.length}) without parent grouping.</p>
      ) : null}

      {summary && projectId ? (
        <LockBaselineModal
          open={lockOpen}
          projectId={projectId}
          summary={summary}
          onClose={() => setLockOpen(false)}
          onLocked={() => {
            setFlash("Baseline locked.");
            void reload();
          }}
        />
      ) : null}
        </>
      )}
    </div>
  );
}
