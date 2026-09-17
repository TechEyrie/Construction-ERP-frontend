import type { ComparisonItem, ComparisonResult } from "@/lib/api/services/quotationsService";
import { StatusBadge, type BadgeStatus } from "@/components/ui/StatusBadge";

function complianceBadge(s: string): BadgeStatus {
  if (s === "Expired") return "Expired";
  if (s === "ExpiringSoon") return "ExpiringSoon";
  return "Valid";
}

function money(qar: string): string {
  const n = Number(qar);
  return Number.isFinite(n)
    ? `QAR ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : `QAR ${qar}`;
}

export function QuotationComparisonTable({
  data,
  canAward,
  onSelectAward
}: {
  data: ComparisonResult;
  canAward?: boolean;
  onSelectAward?: (q: ComparisonItem) => void;
}) {
  if (data.quotations.length === 0) {
    return <p className="opc-tenders-muted">No quotations submitted yet.</p>;
  }

  const awardable =
    Boolean(canAward && onSelectAward) &&
    (data.tenderStatus === "Evaluated" || data.tenderStatus === "Closed") &&
    !data.quotations.some((q) => q.isAwarded);

  return (
    <div className="opc-compare">
      <header className="opc-compare-header">
        <h1 className="opc-compare-h1">{data.tenderTitle}</h1>
        <p className="opc-compare-sub">
          Original Budget {money(data.originalBudget)} · Planned Duration {data.plannedDurationDays} Days · Status{" "}
          {data.tenderStatus}
        </p>
      </header>

      <div className="opc-compare-scroll">
        <table className="opc-compare-table">
          <thead>
            <tr>
              <th>Metric</th>
              {data.quotations.map((q) => (
                <th key={q.quotationId}>
                  <div className="opc-compare-org">{q.contractorOrg.name}</div>
                  <div className="opc-compare-cr">
                    {q.contractorOrg.crNumber ? `CR ${q.contractorOrg.crNumber}` : q.reference}
                  </div>
                  <StatusBadge status={complianceBadge(q.contractorOrg.complianceStatus)} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <th>Commercial Bid</th>
              {data.quotations.map((q) => (
                <td key={q.quotationId} className={q.isLowestPrice ? "opc-compare-amount--gold" : "opc-compare-amount"}>
                  {money(q.amount)}
                  {q.isLowestPrice ? <span className="opc-compare-pill">Lowest Price</span> : null}
                </td>
              ))}
            </tr>
            <tr>
              <th>Variance to Budget</th>
              {data.quotations.map((q) => {
                const under = q.varianceToBudgetAmount.startsWith("-");
                return (
                  <td
                    key={q.quotationId}
                    className={under ? "opc-compare-var--ok" : "opc-compare-var--bad"}
                  >
                    {q.varianceToBudget} ({q.varianceToBudgetAmount.startsWith("-") ? "-" : "+"}QAR{" "}
                    {Math.abs(Number(q.varianceToBudgetAmount)).toLocaleString(undefined, {
                      minimumFractionDigits: 2
                    })}
                    )
                  </td>
                );
              })}
            </tr>
            <tr>
              <th>Proposed Duration</th>
              {data.quotations.map((q) => (
                <td key={q.quotationId}>
                  {q.durationDays} Days
                  {q.isShortestDuration ? <span className="opc-compare-pill opc-compare-pill--muted">Shortest</span> : null}
                </td>
              ))}
            </tr>
            <tr>
              <th>Duration Variance</th>
              {data.quotations.map((q) => (
                <td key={q.quotationId}>
                  {q.durationVarianceDays > 0 ? "+" : ""}
                  {q.durationVarianceDays} Day{Math.abs(q.durationVarianceDays) === 1 ? "" : "s"} vs Planned
                </td>
              ))}
            </tr>
            <tr>
              <th>Proposal Docs</th>
              {data.quotations.map((q) => (
                <td key={q.quotationId}>{q.documentsCount} file(s)</td>
              ))}
            </tr>
            {awardable ? (
              <tr>
                <th>Award</th>
                {data.quotations.map((q) => (
                  <td key={q.quotationId}>
                    <button
                      type="button"
                      className="opc-btn opc-btn--primary"
                      onClick={() => onSelectAward?.(q)}
                    >
                      Select for Award
                    </button>
                  </td>
                ))}
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
