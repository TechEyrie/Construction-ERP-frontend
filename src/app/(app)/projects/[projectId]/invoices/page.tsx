"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { useParams } from "next/navigation";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { isAbortError } from "@/lib/api/abort";
import { listInvoices, type Invoice } from "@/lib/api/services/invoiceService";
import { getSessionUser } from "@/lib/auth/session";
import { useAbortableLoad } from "@/lib/hooks/useAbortableLoad";

function money(qar: string): string {
  const n = Number(qar);
  return Number.isFinite(n)
    ? `QAR ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : `QAR ${qar}`;
}

export default function InvoicesPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId;
  const user = getSessionUser();
  const canCreate = user?.roles?.some((r) => ["Owner", "SystemAdmin", "Contractor"].includes(r));

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(
    async (signal?: AbortSignal) => {
      if (!projectId) return;
      setError(null);
      setLoading(true);
      try {
        setInvoices(await listInvoices(projectId, undefined, signal ? { signal } : undefined));
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

  const totalNet = invoices
    .filter((i) => !["Draft", "Rejected"].includes(i.status))
    .reduce((s, i) => s + Number(i.netAmount), 0);
  const outstanding = invoices
    .filter((i) => !["Draft", "Rejected", "Paid"].includes(i.status))
    .reduce((s, i) => s + Number(i.outstandingAmount), 0);

  return (
    <div className="opc-boq opc-wip">
      <header className="opc-boq-page-head">
        <div>
          <h1 className="opc-boq-h1">Invoice Register</h1>
          <p className="opc-boq-lead">Tax invoices against certified WIP valuations.</p>
        </div>
        {canCreate ? (
          <Link className="opc-btn opc-btn--gold opc-progress-touch" href={`/projects/${projectId}/invoices/new`}>
            + Create Invoice
          </Link>
        ) : null}
      </header>

      {error ? <p className="opc-tenders-error">{error}</p> : null}

      {loading ? (
        <TableSkeleton rows={6} cols={6} />
      ) : (
        <>
          <div className="opc-progress-kpis">
            <div className="opc-progress-kpi">
              <span>Active invoiced</span>
              <strong>{money(String(totalNet.toFixed(2)))}</strong>
            </div>
            <div className="opc-progress-kpi">
              <span>Outstanding</span>
              <strong>{money(String(outstanding.toFixed(2)))}</strong>
            </div>
            <div className="opc-progress-kpi">
              <span>Count</span>
              <strong>{invoices.length}</strong>
            </div>
          </div>

          <div className="opc-tenders-table-wrap">
            <table className="opc-boq-table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>WIP #</th>
                  <th>Date</th>
                  <th>Net</th>
                  <th>Outstanding</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td>
                      <Link className="opc-tenders-link" href={`/projects/${projectId}/invoices/${inv.id}`}>
                        {inv.invoiceNumber}
                      </Link>
                    </td>
                    <td className="opc-boq-num">#{inv.wipNumber ?? "—"}</td>
                    <td className="opc-tenders-muted">{inv.invoiceDate?.slice(0, 10) ?? "—"}</td>
                    <td className="opc-boq-num">{money(inv.netAmount)}</td>
                    <td className="opc-boq-num">{money(inv.outstandingAmount)}</td>
                    <td>
                      {inv.status}
                      {inv.isOverdue ? <span className="opc-tenders-error"> · Overdue</span> : null}
                    </td>
                  </tr>
                ))}
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="opc-tenders-muted">
                      No invoices yet.
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
