"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { useParams } from "next/navigation";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { isAbortError } from "@/lib/api/abort";
import {
  getPaymentSummary,
  listProjectPayments,
  type Payment
} from "@/lib/api/services/paymentService";
import { getSessionUser } from "@/lib/auth/session";
import { useAbortableLoad } from "@/lib/hooks/useAbortableLoad";

function money(qar: string): string {
  const n = Number(qar);
  return Number.isFinite(n)
    ? `QAR ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : `QAR ${qar}`;
}

export default function PaymentsPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId;
  const user = getSessionUser();
  const canSummary = user?.roles?.some((r) => ["Owner", "SystemAdmin", "Finance"].includes(r));

  const [payments, setPayments] = useState<Payment[]>([]);
  const [summary, setSummary] = useState<{
    cumulativePaid: string;
    totalPaymentCount: number;
    cumulativeInvoiced: string;
    paidPercentageOfInvoiced: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(
    async (signal?: AbortSignal) => {
      if (!projectId) return;
      setError(null);
      setLoading(true);
      try {
        const init = signal ? { signal } : undefined;
        const pays = await listProjectPayments(projectId, init);
        if (signal?.aborted) return;
        setPayments(pays);
        if (canSummary) {
          setSummary(await getPaymentSummary(projectId, init));
        }
      } catch (e) {
        if (isAbortError(e) || signal?.aborted) return;
        setError((e as Error).message);
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [projectId, canSummary]
  );

  useAbortableLoad([projectId, canSummary], async (signal) => {
    await reload(signal);
  });

  return (
    <div className="opc-boq opc-wip">
      <header className="opc-boq-page-head">
        <div>
          <h1 className="opc-boq-h1">Payments</h1>
          <p className="opc-boq-lead">Disbursements recorded against invoices.</p>
        </div>
        <Link className="opc-btn opc-progress-touch" href={`/projects/${projectId}/invoices`}>
          Invoices
        </Link>
      </header>

      {error ? <p className="opc-tenders-error">{error}</p> : null}

      {loading ? (
        <TableSkeleton rows={5} cols={4} />
      ) : (
        <>
          {summary ? (
            <div className="opc-progress-kpis">
              <div className="opc-progress-kpi">
                <span>Cumulative paid</span>
                <strong>{money(summary.cumulativePaid)}</strong>
              </div>
              <div className="opc-progress-kpi">
                <span>Invoiced</span>
                <strong>{money(summary.cumulativeInvoiced)}</strong>
              </div>
              <div className="opc-progress-kpi">
                <span>Paid %</span>
                <strong>{summary.paidPercentageOfInvoiced}%</strong>
              </div>
              <div className="opc-progress-kpi">
                <span>Count</span>
                <strong>{summary.totalPaymentCount}</strong>
              </div>
            </div>
          ) : null}

          <div className="opc-tenders-table-wrap">
            <table className="opc-boq-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Invoice</th>
                  <th>Reference</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td className="opc-tenders-muted">{p.paymentDate?.slice(0, 10)}</td>
                    <td>
                      <Link className="opc-tenders-link" href={`/projects/${projectId}/invoices/${p.invoiceId}`}>
                        {p.invoiceNumber ?? p.invoiceId.slice(-6)}
                      </Link>
                    </td>
                    <td>{p.reference}</td>
                    <td className="opc-boq-num">{money(p.amount)}</td>
                  </tr>
                ))}
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="opc-tenders-muted">
                      No payments yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
