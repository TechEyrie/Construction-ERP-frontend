"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { DetailSkeleton } from "@/components/ui/Skeleton";
import {
  autoFillWip,
  getWip,
  patchWipHeader,
  submitWip,
  updateWipLine,
  type Wip
} from "@/lib/api/services/wipService";
import { getSessionUser } from "@/lib/auth/session";

function money(qar: string): string {
  const n = Number(qar);
  return Number.isFinite(n)
    ? `QAR ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : `QAR ${qar}`;
}

export default function WipDetailPage() {
  const params = useParams<{ projectId: string; wipId: string }>();
  const projectId = params.projectId;
  const wipId = params.wipId;
  const router = useRouter();
  const user = getSessionUser();
  const canWrite = user?.roles?.some((r) =>
    ["Owner", "SystemAdmin", "Contractor"].includes(r)
  );

  const [wip, setWip] = useState<Wip | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [edits, setEdits] = useState<Record<string, string>>({});

  const reload = useCallback(async () => {
    if (!projectId || !wipId) return;
    setError(null);
    try {
      const data = await getWip(projectId, wipId);
      setWip(data);
      const next: Record<string, string> = {};
      for (const l of data.lineItems ?? []) next[l.id] = l.currentClaimedQty;
      setEdits(next);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [projectId, wipId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function saveLine(lineId: string) {
    if (!projectId || !wipId) return;
    setBusy(true);
    setError(null);
    try {
      const res = await updateWipLine(projectId, wipId, lineId, {
        currentClaimedQty: edits[lineId]
      });
      setWip({ ...res.wip, lineItems: (wip?.lineItems ?? []).map((l) => (l.id === lineId ? res.line : l)) });
      setFlash("Line updated");
      await reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function onAutoFill() {
    if (!projectId || !wipId) return;
    setBusy(true);
    try {
      setWip(await autoFillWip(projectId, wipId));
      setFlash("Auto-filled from approved progress");
      await reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function onSubmit() {
    if (!projectId || !wipId || !wip) return;
    setBusy(true);
    setError(null);
    try {
      if (!wip.attachmentDocumentIds.length) {
        await patchWipHeader(projectId, wipId, {
          attachmentDocumentIds: ["000000000000000000000001"]
        });
      }
      const submitted = await submitWip(projectId, wipId);
      setWip(submitted);
      setFlash("WIP submitted for consultant review");
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const isEditable = wip?.status === "Draft" || wip?.status === "Returned";

  return (
    <div className="opc-boq opc-wip">
      <p className="opc-tenders-back">
        <Link href={`/projects/${projectId}/wips`}>← WIP list</Link>
      </p>
      {wip ? (
        <header className="opc-boq-page-head">
          <div>
            <h1 className="opc-boq-h1">Interim Payment Application #{wip.wipNumber}</h1>
            <p className="opc-boq-lead">
              {wip.periodStart?.slice(0, 10)} — {wip.periodEnd?.slice(0, 10)} · {wip.status}
            </p>
          </div>
          {canWrite && isEditable ? (
            <div className="opc-tenders-actions">
              <button type="button" className="opc-btn opc-progress-touch" disabled={busy} onClick={() => void onAutoFill()}>
                Auto-fill from Progress
              </button>
              <button type="button" className="opc-btn opc-btn--gold opc-progress-touch" disabled={busy} onClick={() => void onSubmit()}>
                Submit Claim
              </button>
            </div>
          ) : null}
          {wip && (wip.status === "Submitted" || wip.status === "UnderReview" || wip.status === "Certified") ? (
            <div className="opc-tenders-actions">
              <Link className="opc-btn opc-btn--gold opc-progress-touch" href={`/projects/${projectId}/wips/${wipId}/review`}>
                {wip.status === "Certified" ? "View certification" : "Review & certify"}
              </Link>
              {wip.status === "Certified" ? (
                <Link
                  className="opc-btn opc-progress-touch"
                  href={`/projects/${projectId}/invoices/new?wipId=${wipId}`}
                >
                  Create invoice
                </Link>
              ) : null}
            </div>
          ) : null}
        </header>
      ) : null}

      {flash ? (
        <p className="opc-boq-banner opc-boq-banner--ok" role="status">
          {flash}
        </p>
      ) : null}
      {error ? <p className="opc-tenders-error">{error}</p> : null}

      {wip ? (
        <div className="opc-progress-kpis">
          <div className="opc-progress-kpi">
            <span>Gross claimed</span>
            <strong>{money(wip.totalClaimedValue)}</strong>
          </div>
          <div className="opc-progress-kpi">
            <span>Retention</span>
            <strong>− {money(wip.retentionAmount)}</strong>
          </div>
          <div className="opc-progress-kpi">
            <span>Advance recovery</span>
            <strong>− {money(wip.advanceRecoveryAmount)}</strong>
          </div>
          <div className="opc-progress-kpi">
            <span>Net claimed</span>
            <strong>{money(wip.netClaimedValue)}</strong>
          </div>
          {wip.status === "Certified" ? (
            <div className="opc-progress-kpi">
              <span>Net certified</span>
              <strong>{money(wip.netCertifiedValue ?? "0.00")}</strong>
            </div>
          ) : null}
        </div>
      ) : null}

      {wip ? (
        <div className="opc-tenders-table-wrap">
          <table className="opc-boq-table opc-wip-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Prev cert</th>
                <th>Current claim</th>
                <th>Cumulative</th>
                <th>Value</th>
                {isEditable && canWrite ? <th /> : null}
              </tr>
            </thead>
            <tbody>
              {(wip.lineItems ?? []).map((l) => (
                <tr key={l.id}>
                  <td>
                    <strong>{l.itemCode}</strong>
                    <div className="opc-tenders-muted">{l.description}</div>
                  </td>
                  <td className="opc-boq-num">
                    {l.previousCertifiedQty} {l.unit}
                  </td>
                  <td>
                    {isEditable && canWrite ? (
                      <input
                        className="opc-progress-touch opc-wip-qty"
                        inputMode="decimal"
                        value={edits[l.id] ?? l.currentClaimedQty}
                        onChange={(e) => setEdits((s) => ({ ...s, [l.id]: e.target.value }))}
                      />
                    ) : (
                      <span className="opc-boq-num">
                        {l.currentClaimedQty} {l.unit}
                      </span>
                    )}
                  </td>
                  <td className="opc-boq-num">
                    {l.cumulativeClaimedQty} {l.unit}
                  </td>
                  <td className="opc-boq-num">{money(l.currentClaimedValue)}</td>
                  {isEditable && canWrite ? (
                    <td>
                      <button
                        type="button"
                        className="opc-btn opc-progress-touch"
                        disabled={busy}
                        onClick={() => void saveLine(l.id)}
                      >
                        Save
                      </button>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : !error ? (
        <DetailSkeleton />
      ) : null}
    </div>
  );
}
