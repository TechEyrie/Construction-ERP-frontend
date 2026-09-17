"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AwardQuotationModal } from "@/components/tenders/AwardQuotationModal";
import { QuotationComparisonTable } from "@/components/tenders/QuotationComparisonTable";
import { DetailSkeleton } from "@/components/ui/Skeleton";
import {
  getQuotationComparison,
  type ComparisonItem,
  type ComparisonResult
} from "@/lib/api/services/quotationsService";
import { awardTenderQuotation, closeTender, getTender } from "@/lib/api/services/tendersService";
import { getSessionUser } from "@/lib/auth/session";

export default function TenderComparePage() {
  const params = useParams<{ projectId: string; tenderId: string }>();
  const projectId = params.projectId;
  const tenderId = params.tenderId;
  const user = getSessionUser();
  const canCompare = user?.roles?.some((r) => ["Owner", "SystemAdmin", "Consultant"].includes(r));
  const canAward = user?.roles?.some((r) => ["Owner", "SystemAdmin"].includes(r));
  const canClose = canAward;

  const [data, setData] = useState<ComparisonResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [candidate, setCandidate] = useState<ComparisonItem | null>(null);
  const [banner, setBanner] = useState<{ ref: string; value: string; contractId: string } | null>(null);

  const reload = useCallback(async () => {
    if (!projectId || !tenderId || !canCompare) return;
    setError(null);
    try {
      const t = await getTender(projectId, tenderId);
      setStatus(t.status);
      setData(await getQuotationComparison(projectId, tenderId));
    } catch (e) {
      setError((e as Error).message);
    }
  }, [projectId, tenderId, canCompare]);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function onCloseThenCompare() {
    if (!projectId || !tenderId) return;
    setBusy(true);
    try {
      await closeTender(projectId, tenderId);
      await reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (!canCompare) {
    return <p className="opc-tenders-error">Comparison is restricted to Owner / Consultant.</p>;
  }

  return (
    <div className="opc-tenders">
      <p className="opc-tenders-back">
        <Link href={`/projects/${projectId}/tenders/${tenderId}`}>← Tender package</Link>
      </p>
      {banner ? (
        <div className="opc-award-banner" role="status">
          Contract <strong>{banner.ref}</strong> created for {banner.value}.{" "}
          <Link href={`/projects/${projectId}/contracts`}>Open contracts →</Link>
        </div>
      ) : null}
      {(data?.tenderStatus === "Issued" || (!data && status === "Issued")) && canClose ? (
        <p className="opc-compare-hint">
          Tender still Issued. Close bidding to lock quotes, then comparison marks Evaluated.{" "}
          <button type="button" className="opc-btn opc-btn--primary" disabled={busy} onClick={() => void onCloseThenCompare()}>
            Close &amp; Compare
          </button>
        </p>
      ) : null}
      {error ? <p className="opc-tenders-error">{error}</p> : null}
      {data ? (
        <QuotationComparisonTable
          data={data}
          canAward={Boolean(canAward)}
          onSelectAward={(q) => setCandidate(q)}
        />
      ) : (
        <DetailSkeleton />
      )}

      <AwardQuotationModal
        open={Boolean(candidate)}
        projectId={projectId}
        tenderId={tenderId}
        candidate={
          candidate
            ? {
                quotationId: candidate.quotationId,
                contractorName: candidate.contractorOrg.name,
                amount: candidate.amount,
                durationDays: candidate.durationDays
              }
            : null
        }
        onClose={() => setCandidate(null)}
        awardFn={awardTenderQuotation}
        onAwarded={(r) => {
          setBanner({ ref: r.contractReference, value: `QAR ${r.contractValue}`, contractId: r.contractId });
          void reload();
        }}
      />
    </div>
  );
}
