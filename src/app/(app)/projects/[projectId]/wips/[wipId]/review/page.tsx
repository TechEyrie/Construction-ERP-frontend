"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { DetailSkeleton } from "@/components/ui/Skeleton";
import {
  approveAllAsClaimed,
  certifyWip,
  certifyWipLine,
  getWip,
  returnWip,
  startWipReview,
  type Wip
} from "@/lib/api/services/wipService";
import { getSessionUser } from "@/lib/auth/session";

function money(qar: string): string {
  const n = Number(qar);
  return Number.isFinite(n)
    ? `QAR ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : `QAR ${qar}`;
}

export default function WipReviewPage() {
  const params = useParams<{ projectId: string; wipId: string }>();
  const projectId = params.projectId;
  const wipId = params.wipId;
  const router = useRouter();
  const user = getSessionUser();
  const canReview = user?.roles?.some((r) => ["Owner", "SystemAdmin", "Consultant"].includes(r));

  const [wip, setWip] = useState<Wip | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [qty, setQty] = useState<Record<string, string>>({});
  const [remarks, setRemarks] = useState<Record<string, string>>({});
  const [returnReason, setReturnReason] = useState("");

  const reload = useCallback(async () => {
    if (!projectId || !wipId) return;
    setError(null);
    try {
      const data = await getWip(projectId, wipId);
      setWip(data);
      const q: Record<string, string> = {};
      const r: Record<string, string> = {};
      for (const l of data.lineItems ?? []) {
        const unset =
          Number(l.certifiedQty) === 0 || Number(l.certifiedQty) < Number(l.previousCertifiedQty);
        q[l.id] = unset ? l.cumulativeClaimedQty : l.certifiedQty;
        r[l.id] = l.remark ?? "";
      }
      setQty(q);
      setRemarks(r);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [projectId, wipId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const editable = canReview && (wip?.status === "Submitted" || wip?.status === "UnderReview");

  async function onStart() {
    if (!projectId || !wipId) return;
    setBusy(true);
    setError(null);
    try {
      setWip(await startWipReview(projectId, wipId));
      setFlash("Review started");
      await reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function saveLine(lineId: string) {
    if (!projectId || !wipId) return;
    setBusy(true);
    setError(null);
    try {
      const remark = remarks[lineId]?.trim();
      await certifyWipLine(projectId, wipId, lineId, {
        certifiedQty: qty[lineId],
        ...(remark ? { remark } : {})
      });
      setFlash("Line certified");
      await reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function onApproveAll() {
    if (!projectId || !wipId) return;
    setBusy(true);
    setError(null);
    try {
      setWip(await approveAllAsClaimed(projectId, wipId));
      setFlash("All lines approved as claimed");
      await reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function onCertify() {
    if (!projectId || !wipId) return;
    if (!window.confirm("Finalize certification? This permanently freezes valuations.")) return;
    setBusy(true);
    setError(null);
    try {
      const certified = await certifyWip(projectId, wipId);
      setWip(certified);
      setFlash("WIP certified");
      router.push(`/projects/${projectId}/wips/${wipId}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function onReturn() {
    if (!projectId || !wipId) return;
    setBusy(true);
    setError(null);
    try {
      await returnWip(projectId, wipId, returnReason);
      setFlash("WIP returned to contractor");
      router.push(`/projects/${projectId}/wips/${wipId}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="opc-boq opc-wip">
      <p className="opc-tenders-back">
        <Link href={`/projects/${projectId}/wips/${wipId}`}>← WIP detail</Link>
      </p>
      {wip ? (
        <header className="opc-boq-page-head">
          <div>
            <h1 className="opc-boq-h1">Review WIP #{wip.wipNumber}</h1>
            <p className="opc-boq-lead">
              Claimed vs certified · {wip.status}
            </p>
          </div>
          {editable ? (
            <div className="opc-tenders-actions">
              {wip.status === "Submitted" ? (
                <button type="button" className="opc-btn opc-progress-touch" disabled={busy} onClick={() => void onStart()}>
                  Start review
                </button>
              ) : null}
              <button type="button" className="opc-btn opc-progress-touch" disabled={busy} onClick={() => void onApproveAll()}>
                Approve all as claimed
              </button>
              <button type="button" className="opc-btn opc-btn--gold opc-progress-touch" disabled={busy} onClick={() => void onCertify()}>
                Certify WIP
              </button>
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
      {!canReview ? <p className="opc-tenders-error">Consultant / Owner role required to certify.</p> : null}

      {wip ? (
        <div className="opc-progress-kpis">
          <div className="opc-progress-kpi">
            <span>Gross claimed</span>
            <strong>{money(wip.totalClaimedValue)}</strong>
          </div>
          <div className="opc-progress-kpi">
            <span>Gross certified</span>
            <strong>{money(wip.totalCertifiedValue ?? "0.00")}</strong>
          </div>
          <div className="opc-progress-kpi">
            <span>Net certified</span>
            <strong>{money(wip.netCertifiedValue ?? "0.00")}</strong>
          </div>
        </div>
      ) : null}

      {wip ? (
        <div className="opc-tenders-table-wrap">
          <table className="opc-boq-table opc-wip-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Prev</th>
                <th>Claimed</th>
                <th>Certified qty</th>
                <th>Remark</th>
                {editable ? <th /> : null}
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
                  <td className="opc-boq-num">
                    {l.cumulativeClaimedQty} {l.unit}
                  </td>
                  <td>
                    {editable ? (
                      <input
                        className="opc-progress-touch opc-wip-qty"
                        inputMode="decimal"
                        value={qty[l.id] ?? l.certifiedQty}
                        onChange={(e) => setQty((s) => ({ ...s, [l.id]: e.target.value }))}
                      />
                    ) : (
                      <span className="opc-boq-num">
                        {l.certifiedQty} {l.unit}
                      </span>
                    )}
                  </td>
                  <td>
                    {editable ? (
                      <input
                        className="opc-progress-touch"
                        placeholder="Required if below claimed"
                        value={remarks[l.id] ?? ""}
                        onChange={(e) => setRemarks((s) => ({ ...s, [l.id]: e.target.value }))}
                      />
                    ) : (
                      <span className="opc-tenders-muted">{l.remark ?? "—"}</span>
                    )}
                  </td>
                  {editable ? (
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

      {editable ? (
        <section className="opc-wip-create" style={{ marginTop: "1.5rem" }}>
          <label>
            Return reason
            <input
              className="opc-progress-touch"
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              placeholder="Min 10 characters"
            />
          </label>
          <button type="button" className="opc-btn opc-progress-touch" disabled={busy} onClick={() => void onReturn()}>
            Return to contractor
          </button>
        </section>
      ) : null}
    </div>
  );
}
