"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { isAbortError } from "@/lib/api/abort";
import { createWip, listWips, type Wip } from "@/lib/api/services/wipService";
import { getSessionUser } from "@/lib/auth/session";
import { useAbortableLoad } from "@/lib/hooks/useAbortableLoad";

function money(qar: string): string {
  const n = Number(qar);
  return Number.isFinite(n)
    ? `QAR ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : `QAR ${qar}`;
}

export default function WipsPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId;
  const router = useRouter();
  const user = getSessionUser();
  const canWrite = user?.roles?.some((r) =>
    ["Owner", "SystemAdmin", "Contractor"].includes(r)
  );

  const [wips, setWips] = useState<Wip[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [periodStart, setPeriodStart] = useState("2026-08-01");
  const [periodEnd, setPeriodEnd] = useState("2026-08-31");

  const reload = useCallback(
    async (signal?: AbortSignal) => {
      if (!projectId) return;
      setError(null);
      setLoading(true);
      try {
        setWips(await listWips(projectId, undefined, signal ? { signal } : undefined));
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

  async function onCreate() {
    if (!projectId) return;
    setBusy(true);
    setError(null);
    try {
      const wip = await createWip(projectId, {
        periodStart: new Date(`${periodStart}T00:00:00.000Z`).toISOString(),
        periodEnd: new Date(`${periodEnd}T00:00:00.000Z`).toISOString(),
        autoPopulateFromProgress: true,
        // ponytail: placeholder ObjectId until file picker; submit requires ≥1 id
        attachmentDocumentIds: ["000000000000000000000001"]
      });
      router.push(`/projects/${projectId}/wips/${wip.id}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="opc-boq opc-wip">
      <header className="opc-boq-page-head">
        <div>
          <h1 className="opc-boq-h1">WIP & Valuation</h1>
          <p className="opc-boq-lead">Interim payment applications from approved site progress.</p>
        </div>
      </header>

      {error ? <p className="opc-tenders-error">{error}</p> : null}

      {canWrite ? (
        <section className="opc-wip-create">
          <label>
            Period start
            <input type="date" className="opc-progress-touch" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
          </label>
          <label>
            Period end
            <input type="date" className="opc-progress-touch" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
          </label>
          <button type="button" className="opc-btn opc-btn--gold opc-progress-touch" disabled={busy} onClick={() => void onCreate()}>
            + Create WIP (auto-fill progress)
          </button>
        </section>
      ) : null}

      {loading ? (
        <TableSkeleton rows={5} cols={5} />
      ) : (
        <div className="opc-tenders-table-wrap">
          <table className="opc-boq-table">
            <thead>
              <tr>
                <th>WIP#</th>
                <th>Period</th>
                <th>Gross</th>
                <th>Net</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {wips.map((w) => (
                <tr key={w.id}>
                  <td>
                    <Link className="opc-tenders-link" href={`/projects/${projectId}/wips/${w.id}`}>
                      #{w.wipNumber}
                    </Link>
                    {w.status === "Submitted" || w.status === "UnderReview" ? (
                      <>
                        {" · "}
                        <Link className="opc-tenders-link" href={`/projects/${projectId}/wips/${w.id}/review`}>
                          Review
                        </Link>
                      </>
                    ) : null}
                  </td>
                  <td className="opc-tenders-muted">
                    {w.periodStart?.slice(0, 10)} → {w.periodEnd?.slice(0, 10)}
                  </td>
                  <td className="opc-boq-num">{money(w.totalClaimedValue)}</td>
                  <td className="opc-boq-num">{money(w.netClaimedValue)}</td>
                  <td>{w.status}</td>
                </tr>
              ))}
              {wips.length === 0 ? (
                <tr>
                  <td colSpan={5} className="opc-tenders-muted">
                    No WIP applications yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
