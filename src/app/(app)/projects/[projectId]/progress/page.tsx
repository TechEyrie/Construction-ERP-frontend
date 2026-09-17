"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { isAbortError } from "@/lib/api/abort";
import { listBoqItems, type BoqItemRow } from "@/lib/api/services/boqService";
import { ModalHead } from "@/components/ui/ModalHead";
import { ModalPortal } from "@/components/ui/ModalPortal";
import { TableSkeleton } from "@/components/ui/Skeleton";
import {
  createProgress,
  getProgressSummary,
  listProgress,
  reviewProgress,
  type ProgressSummary,
  type ProgressUpdate
} from "@/lib/api/services/progressService";
import { getSessionUser } from "@/lib/auth/session";
import { useAbortableLoad } from "@/lib/hooks/useAbortableLoad";

function money(qar: string): string {
  const n = Number(qar);
  return Number.isFinite(n)
    ? `QAR ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : `QAR ${qar}`;
}

type Tab = "all" | "Submitted" | "over";

export default function ProgressPage() {
  return (
    <Suspense fallback={<TableSkeleton rows={6} cols={5} />}>
      <ProgressContent />
    </Suspense>
  );
}

function ProgressContent() {
  const params = useParams<{ projectId: string }>();
  const search = useSearchParams();
  const projectId = params.projectId;
  const preselectItem = search.get("boqItemId") ?? "";

  const user = getSessionUser();
  const canWrite = user?.roles?.some((r) =>
    ["Owner", "SystemAdmin", "Consultant", "Contractor"].includes(r)
  );
  const canReview = user?.roles?.some((r) => ["Owner", "SystemAdmin", "Consultant"].includes(r));
  const canOverride = user?.roles?.some((r) => ["Owner", "SystemAdmin"].includes(r));

  const [summary, setSummary] = useState<ProgressSummary | null>(null);
  const [updates, setUpdates] = useState<ProgressUpdate[]>([]);
  const [items, setItems] = useState<BoqItemRow[]>([]);
  const [tab, setTab] = useState<Tab>("all");
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [entryOpen, setEntryOpen] = useState(Boolean(preselectItem));
  const [reviewId, setReviewId] = useState<string | null>(null);

  const [boqItemId, setBoqItemId] = useState(preselectItem);
  const [qty, setQty] = useState("");
  const [pct, setPct] = useState("");
  const [comment, setComment] = useState("");
  const [overrideReason, setOverrideReason] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const selected = useMemo(() => items.find((i) => i.id === boqItemId), [items, boqItemId]);

  const reload = useCallback(
    async (signal?: AbortSignal) => {
      if (!projectId) return;
      setError(null);
      setLoading(true);
      try {
        const init = signal ? { signal } : undefined;
        const [s, u] = await Promise.all([
          getProgressSummary(projectId, init),
          listProgress(projectId, { ...(signal ? { signal } : {}) })
        ]);
        if (signal?.aborted) return;
        setSummary(s);
        setUpdates(u);
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

  // Lazy-load BOQ picker only when recording progress
  useEffect(() => {
    if (!entryOpen || !projectId || items.length > 0) return;
    const ac = new AbortController();
    void listBoqItems(projectId, { signal: ac.signal })
      .then((leaf) => {
        if (!ac.signal.aborted) setItems(leaf.filter((i) => i.isBaseline));
      })
      .catch((e) => {
        if (isAbortError(e)) return;
      });
    return () => ac.abort();
  }, [entryOpen, projectId, items.length]);

  const filtered = useMemo(() => {
    if (tab === "Submitted") return updates.filter((u) => u.status === "Submitted");
    if (tab === "over") return updates.filter((u) => u.isOverCompletion);
    return updates;
  }, [updates, tab]);

  function syncFromQty(v: string) {
    setQty(v);
    const cq = Number(selected?.contractQty ?? 0);
    const n = Number(v);
    if (cq > 0 && Number.isFinite(n)) setPct(String(Math.round((n / cq) * 10000) / 100));
  }

  function syncFromPct(v: string) {
    setPct(v);
    const cq = Number(selected?.contractQty ?? 0);
    const n = Number(v);
    if (cq > 0 && Number.isFinite(n)) setQty(String(Math.round(cq * n) / 100));
  }

  async function onSubmitEntry() {
    if (!projectId || !boqItemId) return;
    setBusy(true);
    setError(null);
    try {
      const payload: Parameters<typeof createProgress>[1] = {
        boqItemId,
        comment: comment || "Site progress entry",
        submitDirectly: true,
        progressDate: new Date().toISOString()
      };
      if (qty) payload.completedQty = qty;
      else if (pct) payload.completionPct = Number(pct);
      const over =
        selected && qty && Number(qty) > Number(selected.contractQty);
      if (over && canOverride && overrideReason.length >= 10) {
        payload.adminOverrideReason = overrideReason;
      }
      await createProgress(projectId, payload);
      setFlash("Progress submitted for review");
      setEntryOpen(false);
      setQty("");
      setPct("");
      setComment("");
      setOverrideReason("");
      await reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function onReview(action: "Approve" | "Return") {
    if (!projectId || !reviewId) return;
    setBusy(true);
    setError(null);
    try {
      await reviewProgress(projectId, reviewId, { action, reviewComment });
      setFlash(`Progress ${action === "Approve" ? "approved" : "returned"}`);
      setReviewId(null);
      setReviewComment("");
      await reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const reviewing = updates.find((u) => u.id === reviewId);

  return (
    <div className="opc-boq opc-progress">
      <header className="opc-boq-page-head">
        <div>
          <h1 className="opc-boq-h1">Construction Progress Control</h1>
          <p className="opc-boq-lead">
            {summary?.progressMethod ?? "VALUE_WEIGHTED"} · append-only site ledger
          </p>
        </div>
        {canWrite ? (
          <button type="button" className="opc-btn opc-btn--gold opc-progress-touch" onClick={() => setEntryOpen(true)}>
            + Record Progress
          </button>
        ) : null}
      </header>

      {flash ? (
        <p className="opc-boq-banner opc-boq-banner--ok" role="status">
          {flash}
        </p>
      ) : null}
      {error ? <p className="opc-tenders-error">{error}</p> : null}

      {loading ? (
        <TableSkeleton rows={6} cols={5} />
      ) : (
        <>
      {summary ? (
        <div className="opc-progress-kpis">
          <div className="opc-progress-kpi">
            <span>Overall physical</span>
            <strong>{summary.overallPhysicalProgressPct}%</strong>
            <div className="opc-progress-gauge" aria-hidden>
              <div style={{ width: `${Math.min(100, summary.overallPhysicalProgressPct)}%` }} />
            </div>
          </div>
          <div className="opc-progress-kpi">
            <span>Completed value</span>
            <strong>{money(summary.totalCompletedValue)}</strong>
          </div>
          <div className="opc-progress-kpi">
            <span>Baseline BOQ</span>
            <strong>{money(summary.totalBaselineBoqValue)}</strong>
          </div>
          <div className={`opc-progress-kpi${summary.pendingReviewCount ? " opc-progress-kpi--warn" : ""}`}>
            <span>Pending reviews</span>
            <strong>{summary.pendingReviewCount}</strong>
          </div>
        </div>
      ) : null}

      <div className="opc-tenders-tabs" role="tablist">
        {(
          [
            ["all", "All"],
            ["Submitted", "Pending review"],
            ["over", "Over-completions"]
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            className={`opc-tenders-tab${tab === id ? " opc-tenders-tab--active" : ""}`}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="opc-tenders-table-wrap">
        <table className="opc-boq-table opc-progress-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th>Value</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id}>
                <td>
                  <Link href={`/projects/${projectId}/boq/items/${u.boqItemId}`} className="opc-tenders-link">
                    {u.itemCode}
                  </Link>
                  <div className="opc-tenders-muted">{u.itemDescription}</div>
                </td>
                <td className="opc-boq-num">
                  {u.completedQty} {u.unit}
                  <div className="opc-tenders-muted">{u.completionPct}%</div>
                </td>
                <td className="opc-boq-num">{money(u.completedValue)}</td>
                <td>{u.status}</td>
                <td>
                  {canReview && u.status === "Submitted" ? (
                    <button
                      type="button"
                      className="opc-btn opc-progress-touch"
                      onClick={() => {
                        setReviewId(u.id);
                        setReviewComment("");
                      }}
                    >
                      Review
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="opc-tenders-muted">
                  No progress updates in this view.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
        </>
      )}

      {entryOpen ? (
        <ModalPortal>
          <div
            className="opc-progress-sheet"
            role="presentation"
            onClick={() => setEntryOpen(false)}
          >
            <div
              className="opc-progress-sheet__panel"
              role="dialog"
              aria-modal="true"
              aria-label="Record progress"
              onClick={(e) => e.stopPropagation()}
            >
              <ModalHead title="Record progress" onClose={() => setEntryOpen(false)} />
              <label className="opc-progress-field">
                BOQ item
                <select
                  className="opc-progress-touch"
                  value={boqItemId}
                  onChange={(e) => setBoqItemId(e.target.value)}
                >
                  <option value="">Select item…</option>
                  {items.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.itemCode} — {i.description} ({i.contractQty} {i.unit})
                    </option>
                  ))}
                </select>
              </label>
              <div className="opc-progress-dual">
                <label className="opc-progress-field">
                  Completed qty
                  <input
                    className="opc-progress-touch"
                    inputMode="decimal"
                    value={qty}
                    onChange={(e) => syncFromQty(e.target.value)}
                  />
                </label>
                <label className="opc-progress-field">
                  Completion %
                  <input
                    className="opc-progress-touch"
                    inputMode="decimal"
                    value={pct}
                    onChange={(e) => syncFromPct(e.target.value)}
                  />
                </label>
              </div>
              <label className="opc-progress-field">
                Comment
                <textarea
                  className="opc-progress-touch"
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </label>
              {canOverride && selected && qty && Number(qty) > Number(selected.contractQty) ? (
                <label className="opc-progress-field">
                  Admin override reason (≥10 chars)
                  <textarea
                    className="opc-progress-touch"
                    rows={2}
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                  />
                </label>
              ) : null}
              <div className="opc-tenders-actions">
                <button type="button" className="opc-btn opc-progress-touch" onClick={() => setEntryOpen(false)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="opc-btn opc-btn--gold opc-progress-touch"
                  disabled={busy || !boqItemId || (!qty && !pct)}
                  onClick={() => void onSubmitEntry()}
                >
                  Submit for review
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      ) : null}

      {reviewing ? (
        <ModalPortal>
          <div
            className="opc-progress-sheet"
            role="presentation"
            onClick={() => setReviewId(null)}
          >
            <div
              className="opc-progress-sheet__panel"
              role="dialog"
              aria-modal="true"
              aria-label="Review progress"
              onClick={(e) => e.stopPropagation()}
            >
              <ModalHead title={`Review ${reviewing.itemCode}`} onClose={() => setReviewId(null)} />
              <p>
                {reviewing.completedQty} {reviewing.unit} · {money(reviewing.completedValue)} ·{" "}
                {reviewing.completionPct}%
              </p>
              <p className="opc-tenders-muted">{reviewing.comment}</p>
              <label className="opc-progress-field">
                Review comment
                <textarea
                  className="opc-progress-touch"
                  rows={3}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                />
              </label>
              <div className="opc-tenders-actions">
                <button type="button" className="opc-btn opc-progress-touch" onClick={() => setReviewId(null)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="opc-btn opc-progress-touch"
                  disabled={busy || reviewComment.trim().length < 5}
                  onClick={() => void onReview("Return")}
                >
                  Return
                </button>
                <button
                  type="button"
                  className="opc-btn opc-btn--gold opc-progress-touch"
                  disabled={busy || reviewComment.trim().length < 5}
                  onClick={() => void onReview("Approve")}
                >
                  Approve
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      ) : null}
    </div>
  );
}
