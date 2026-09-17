"use client";

import { useCallback, useState } from "react";
import { useParams } from "next/navigation";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { isAbortError } from "@/lib/api/abort";
import {
  closeFundingSource,
  createFundingSource,
  getFundingSummary,
  listDrawdowns,
  listFundingSources,
  recordDrawdown,
  type FundingSource,
  type FundingSummary,
  type FundingTransaction
} from "@/lib/api/services/fundingService";
import { getSessionUser } from "@/lib/auth/session";
import { useAbortableLoad } from "@/lib/hooks/useAbortableLoad";

function money(qar: string): string {
  const n = Number(qar);
  return Number.isFinite(n)
    ? `QAR ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : `QAR ${qar}`;
}

function toIsoDate(d: string): string {
  return new Date(`${d}T00:00:00.000Z`).toISOString();
}

export default function FundingPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId;
  const user = getSessionUser();
  const canAccess = user?.roles?.some((r) => ["Owner", "SystemAdmin", "Finance"].includes(r));
  const canManage = user?.roles?.some((r) => ["Owner", "SystemAdmin"].includes(r));
  const canDraw = canAccess;
  const canOverride = canManage;

  const [sources, setSources] = useState<FundingSource[]>([]);
  const [summary, setSummary] = useState<FundingSummary | null>(null);
  const [selectedId, setSelectedId] = useState<string>("");
  const [txs, setTxs] = useState<FundingTransaction[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const [srcType, setSrcType] = useState<"BankLoan" | "OwnerEquity" | "Other">("BankLoan");
  const [bankName, setBankName] = useState("QNB");
  const [facilityRef, setFacilityRef] = useState("");
  const [approved, setApproved] = useState("");
  const [facilityDate, setFacilityDate] = useState("2026-01-15");

  const [ddAmount, setDdAmount] = useState("");
  const [ddRef, setDdRef] = useState("");
  const [ddDate, setDdDate] = useState("2026-02-01");
  const [overrideAck, setOverrideAck] = useState(false);

  const reload = useCallback(
    async (signal?: AbortSignal) => {
      if (!projectId || !canAccess) return;
      setError(null);
      setLoading(true);
      try {
        const init = signal ? { signal } : undefined;
        const [srcs, sum] = await Promise.all([
          listFundingSources(projectId, init),
          getFundingSummary(projectId, init)
        ]);
        if (signal?.aborted) return;
        setSources(srcs);
        setSummary(sum);
        const sid = selectedId && srcs.some((s) => s.id === selectedId) ? selectedId : srcs[0]?.id ?? "";
        setSelectedId(sid);
        if (sid) setTxs(await listDrawdowns(projectId, sid, init));
        else setTxs([]);
      } catch (e) {
        if (isAbortError(e) || signal?.aborted) return;
        setError((e as Error).message);
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [projectId, selectedId, canAccess]
  );

  useAbortableLoad([projectId, canAccess], async (signal) => {
    await reload(signal);
  });

  async function onCreateSource(e: React.FormEvent) {
    e.preventDefault();
    if (!projectId || !canManage) return;
    setBusy(true);
    setError(null);
    try {
      await createFundingSource(projectId, {
        type: srcType,
        ...(srcType === "BankLoan" ? { bankName } : {}),
        facilityReference: facilityRef,
        approvedAmount: approved,
        facilityDate: toIsoDate(facilityDate)
      });
      setFacilityRef("");
      setApproved("");
      await reload();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function onDrawdown(e: React.FormEvent) {
    e.preventDefault();
    if (!projectId || !selectedId || !canDraw) return;
    setBusy(true);
    setError(null);
    try {
      await recordDrawdown(projectId, selectedId, {
        transactionDate: toIsoDate(ddDate),
        amount: ddAmount,
        reference: ddRef,
        overrideAcknowledged: canOverride ? overrideAck : false
      });
      setDdAmount("");
      setDdRef("");
      setOverrideAck(false);
      await reload();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function onToggleStatus(src: FundingSource) {
    if (!projectId || !canManage) return;
    setBusy(true);
    try {
      await closeFundingSource(projectId, src.id, src.status === "Closed" ? "Active" : "Closed");
      await reload();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const selected = sources.find((s) => s.id === selectedId);

  if (!canAccess) {
    return (
      <div className="opc-boq opc-wip">
        <header className="opc-boq-page-head">
          <div>
            <h1 className="opc-boq-h1">Bank Funding</h1>
            <p className="opc-boq-lead">Facilities, drawdowns, and liquidity vs paid.</p>
          </div>
        </header>
        <p className="opc-tenders-error">
          Funding data is restricted to Owner and Finance roles.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="opc-boq opc-wip">
        <header className="opc-boq-page-head">
          <div>
            <h1 className="opc-boq-h1">Bank Funding</h1>
            <p className="opc-boq-lead">Facilities, drawdowns, and liquidity vs paid.</p>
          </div>
        </header>
        <TableSkeleton rows={5} cols={5} />
      </div>
    );
  }

  return (
    <div className="opc-boq opc-wip">
      <header className="opc-boq-page-head">
        <div>
          <h1 className="opc-boq-h1">Bank Funding</h1>
          <p className="opc-boq-lead">Facilities, drawdowns, and liquidity vs paid.</p>
        </div>
      </header>

      {error ? <p className="opc-tenders-error">{error}</p> : null}

      {summary ? (
        <div className="opc-progress-kpis">
          <div className="opc-progress-kpi">
            <span>Approved</span>
            <strong>{money(summary.totalApproved)}</strong>
          </div>
          <div className="opc-progress-kpi">
            <span>Drawn</span>
            <strong>{money(summary.totalFundingDrawn)}</strong>
          </div>
          <div className="opc-progress-kpi">
            <span>Remaining</span>
            <strong>{money(summary.fundingRemaining)}</strong>
          </div>
          <div className="opc-progress-kpi">
            <span>Paid</span>
            <strong>{money(summary.cumulativePaid)}</strong>
          </div>
          <div className="opc-progress-kpi">
            <span>Liquidity buffer</span>
            <strong>{money(summary.netLiquidityBuffer)}</strong>
          </div>
        </div>
      ) : null}

      {canManage ? (
        <form className="opc-boq-form" onSubmit={onCreateSource}>
          <h2 className="opc-boq-h2">New facility</h2>
          <label>
            Type
            <select value={srcType} onChange={(e) => setSrcType(e.target.value as typeof srcType)}>
              <option value="BankLoan">BankLoan</option>
              <option value="OwnerEquity">OwnerEquity</option>
              <option value="Other">Other</option>
            </select>
          </label>
          {srcType === "BankLoan" ? (
            <label>
              Bank
              <input value={bankName} onChange={(e) => setBankName(e.target.value)} required />
            </label>
          ) : null}
          <label>
            Facility ref
            <input value={facilityRef} onChange={(e) => setFacilityRef(e.target.value)} required />
          </label>
          <label>
            Approved amount
            <input value={approved} onChange={(e) => setApproved(e.target.value)} required />
          </label>
          <label>
            Facility date
            <input type="date" value={facilityDate} onChange={(e) => setFacilityDate(e.target.value)} />
          </label>
          <button className="opc-btn" type="submit" disabled={busy}>
            Create facility
          </button>
        </form>
      ) : null}

      <div className="opc-tenders-table-wrap">
        <table className="opc-boq-table">
          <thead>
            <tr>
              <th>Reference</th>
              <th>Type</th>
              <th>Approved</th>
              <th>Drawn</th>
              <th>Remaining</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {sources.map((s) => (
              <tr
                key={s.id}
                className={s.id === selectedId ? "opc-row-selected" : undefined}
                onClick={() => {
                  setSelectedId(s.id);
                  void listDrawdowns(projectId, s.id).then(setTxs).catch((err) => setError(err.message));
                }}
              >
                <td>{s.facilityReference}</td>
                <td>{s.type}</td>
                <td className="opc-boq-num">{money(s.approvedAmount)}</td>
                <td className="opc-boq-num">{money(s.totalDrawn)}</td>
                <td className="opc-boq-num">{money(s.remainingFacility)}</td>
                <td>{s.status}</td>
                <td>
                  {canManage ? (
                    <button
                      type="button"
                      className="opc-btn opc-btn-ghost"
                      disabled={busy}
                      onClick={(ev) => {
                        ev.stopPropagation();
                        void onToggleStatus(s);
                      }}
                    >
                      {s.status === "Closed" ? "Reopen" : "Close"}
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
            {sources.length === 0 ? (
              <tr>
                <td colSpan={7} className="opc-tenders-muted">
                  No funding sources yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {selected && canDraw ? (
        <form className="opc-boq-form" onSubmit={onDrawdown}>
          <h2 className="opc-boq-h2">Record drawdown — {selected.facilityReference}</h2>
          <p className="opc-tenders-muted">
            Headroom {money(selected.remainingFacility)} · status {selected.status}
          </p>
          <label>
            Amount
            <input value={ddAmount} onChange={(e) => setDdAmount(e.target.value)} required />
          </label>
          <label>
            Reference
            <input value={ddRef} onChange={(e) => setDdRef(e.target.value)} required />
          </label>
          <label>
            Date
            <input type="date" value={ddDate} onChange={(e) => setDdDate(e.target.value)} />
          </label>
          {canOverride ? (
            <label className="opc-check">
              <input
                type="checkbox"
                checked={overrideAck}
                onChange={(e) => setOverrideAck(e.target.checked)}
              />
              Acknowledge facility ceiling override
            </label>
          ) : (
            <p className="opc-tenders-muted">Finance cannot override facility ceiling.</p>
          )}
          <button className="opc-btn" type="submit" disabled={busy || selected.status === "Closed"}>
            Record drawdown
          </button>
        </form>
      ) : null}

      {selected ? (
        <div className="opc-tenders-table-wrap">
          <h2 className="opc-boq-h2">Drawdowns</h2>
          <table className="opc-boq-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Reference</th>
                <th>Amount</th>
                <th>Override</th>
              </tr>
            </thead>
            <tbody>
              {txs.map((t) => (
                <tr key={t.id}>
                  <td className="opc-tenders-muted">{t.transactionDate?.slice(0, 10)}</td>
                  <td>{t.reference}</td>
                  <td className="opc-boq-num">{money(t.amount)}</td>
                  <td>{t.overrideAcknowledged ? "Yes" : "—"}</td>
                </tr>
              ))}
              {txs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="opc-tenders-muted">
                    No drawdowns.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
