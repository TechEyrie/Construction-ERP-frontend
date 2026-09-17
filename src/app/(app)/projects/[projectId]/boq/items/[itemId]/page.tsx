"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { DetailSkeleton } from "@/components/ui/Skeleton";
import {
  getBoqItemDetail,
  getBoqItemEvidence,
  getBoqItemProgressHistory,
  getBoqItemWipHistory,
  type BoqItemDetail
} from "@/lib/api/services/boqService";
import { downloadUrl } from "@/lib/api/services/documentsService";
import { getSessionUser } from "@/lib/auth/session";

function money(qar: string): string {
  const n = Number(qar);
  return Number.isFinite(n)
    ? `QAR ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : `QAR ${qar}`;
}

function Ribbon({
  baseline,
  physical,
  claimed,
  certified,
  paid
}: {
  baseline: number;
  physical: number;
  claimed: number;
  certified: number;
  paid: number;
}) {
  const max = Math.max(baseline, physical, claimed, certified, paid, 1);
  const w = (v: number) => `${Math.min(100, (v / max) * 100)}%`;
  return (
    <div className="opc-boq-ribbon" aria-label="Exposure pipeline">
      {[
        ["Baseline", baseline, "opc-boq-ribbon__bar--base"],
        ["Physical", physical, "opc-boq-ribbon__bar--phys"],
        ["Claimed", claimed, "opc-boq-ribbon__bar--claim"],
        ["Certified", certified, "opc-boq-ribbon__bar--cert"],
        ["Paid", paid, "opc-boq-ribbon__bar--paid"]
      ].map(([label, val, cls]) => (
        <div key={String(label)} className="opc-boq-ribbon__row">
          <span>{label}</span>
          <div className="opc-boq-ribbon__track">
            <div className={`opc-boq-ribbon__bar ${cls}`} style={{ width: w(Number(val)) }} />
          </div>
          <strong>{money(String(val))}</strong>
        </div>
      ))}
    </div>
  );
}

export default function BoqItemDetailPage() {
  const params = useParams<{ projectId: string; itemId: string }>();
  const projectId = params.projectId;
  const itemId = params.itemId;
  const user = getSessionUser();
  const isContractor = user?.roles?.includes("Contractor");
  const isFinance = user?.roles?.includes("Finance") && !user?.roles?.some((r) => ["Owner", "SystemAdmin", "Consultant"].includes(r));

  const [detail, setDetail] = useState<BoqItemDetail | null>(null);
  const [progress, setProgress] = useState<Array<Record<string, unknown>>>([]);
  const [wips, setWips] = useState<Array<Record<string, unknown>>>([]);
  const [evidence, setEvidence] = useState<Array<{ id: string; fileName: string; fileKey: string; mimeType: string }>>(
    []
  );
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!projectId || !itemId) return;
    setError(null);
    try {
      const [d, p, w, e] = await Promise.all([
        getBoqItemDetail(projectId, itemId),
        getBoqItemProgressHistory(projectId, itemId),
        getBoqItemWipHistory(projectId, itemId),
        getBoqItemEvidence(projectId, itemId)
      ]);
      setDetail(d);
      setProgress(p.updates ?? []);
      setWips(w.records ?? []);
      setEvidence(e.items ?? []);
    } catch (err) {
      setError((err as Error).message);
    }
  }, [projectId, itemId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const x = detail?.exposure;

  return (
    <div className="opc-boq opc-boq-detail">
      <p className="opc-boq-back">
        <Link href={`/projects/${projectId}/boq`}>← Bill of Quantities</Link>
      </p>

      {error ? <p className="opc-tenders-error">{error}</p> : null}

      {detail && x ? (
        <>
          <header className="opc-boq-detail-hero">
            <div>
              <p className="opc-boq-crumb">{detail.sectionPath.join(" / ") || "WBS"}</p>
              <h1 className="opc-boq-h1">
                <code>{detail.itemCode}</code> {detail.description}
              </h1>
              <p className="opc-boq-lead">
                {detail.unit} · {x.contractQty} @ {money(x.unitRate)}
              </p>
            </div>
            <span className={detail.isBaseline ? "opc-boq-badge opc-boq-badge--locked" : "opc-boq-badge"}>
              {detail.isBaseline ? "Baseline Locked" : "Draft"}
            </span>
          </header>

          {x.isOverCertified ? (
            <p className="opc-boq-banner opc-boq-banner--warn" role="status">
              Over-certified by {money(x.overCertifiedDelta)}
            </p>
          ) : null}

          <div className="opc-boq-metrics opc-boq-metrics--detail">
            <div className="opc-boq-metric opc-boq-metric--gold">
              <span>Contract Baseline</span>
              <strong>{money(x.boqAmount)}</strong>
            </div>
            <div className="opc-boq-metric">
              <span>Physical ({x.physicalCompletionPct}%)</span>
              <strong>{money(x.physicalCompletedValue)}</strong>
            </div>
            <div className="opc-boq-metric">
              <span>Certified ({x.certifiedPct}%)</span>
              <strong>{money(x.certifiedValue)}</strong>
            </div>
            <div className="opc-boq-metric">
              <span>Paid ({x.paidPct}%)</span>
              <strong>{money(x.paidValue)}</strong>
            </div>
          </div>

          <section className="opc-boq-list">
            <h2 className="opc-boq-h2">Exposure pipeline</h2>
            <Ribbon
              baseline={Number(x.boqAmount)}
              physical={Number(x.physicalCompletedValue)}
              claimed={Number(x.claimedValue)}
              certified={Number(x.certifiedValue)}
              paid={Number(x.paidValue)}
            />
            <p className="opc-tenders-muted">
              Unbilled physical: {money(x.unbilledPhysicalValue)} ({x.unbilledPhysicalQty} {detail.unit})
            </p>
          </section>

          {isContractor && !isFinance ? (
            <p className="opc-boq-banner opc-boq-banner--ok">
              <Link href={`/projects/${projectId}/progress?boqItemId=${itemId}`}>Log site progress →</Link>
            </p>
          ) : null}

          <section className="opc-boq-list">
            <h2 className="opc-boq-h2">Progress history ({progress.length})</h2>
            {progress.length === 0 ? (
              <p className="opc-tenders-muted">No progress updates yet.</p>
            ) : (
              <ul className="opc-boq-timeline">
                {progress.map((u) => (
                  <li key={String(u.id)}>
                    <strong>{String(u.status)}</strong> · {String(u.completedQty)} {detail.unit} ·{" "}
                    {money(String(u.completedValue))}
                    <span className="opc-tenders-muted">
                      {" "}
                      {(u.submittedBy as { name?: string })?.name ?? ""} · {String(u.progressDate).slice(0, 10)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="opc-boq-list">
            <h2 className="opc-boq-h2">WIP ledger ({wips.length})</h2>
            {wips.length === 0 ? (
              <p className="opc-tenders-muted">No WIP valuations yet.</p>
            ) : (
              <table className="opc-boq-table">
                <thead>
                  <tr>
                    <th>WIP#</th>
                    <th>Status</th>
                    <th>Claimed</th>
                    <th>Certified</th>
                  </tr>
                </thead>
                <tbody>
                  {wips.map((r) => (
                    <tr key={String(r.id)}>
                      <td>{String(r.wipNumber)}</td>
                      <td>{String(r.status)}</td>
                      <td className="opc-boq-num">{money(String(r.currentClaimedValue))}</td>
                      <td className="opc-boq-num">{money(String(r.certifiedValue))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <section className="opc-boq-list">
            <h2 className="opc-boq-h2">Evidence ({evidence.length})</h2>
            {evidence.length === 0 ? (
              <p className="opc-tenders-muted">No attachments.</p>
            ) : (
              <ul className="opc-boq-evidence">
                {evidence.map((f) => (
                  <li key={f.id}>
                    <a href={downloadUrl(f.fileKey)} target="_blank" rel="noreferrer">
                      {f.fileName}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      ) : !error ? (
        <DetailSkeleton />
      ) : null}
    </div>
  );
}
