"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { DetailSkeleton } from "@/components/ui/Skeleton";
import {
  approveInvoice,
  getInvoice,
  moveInvoiceToFinance,
  rejectInvoice,
  submitInvoice,
  type Invoice
} from "@/lib/api/services/invoiceService";
import {
  listInvoicePayments,
  recordPayment,
  type Payment
} from "@/lib/api/services/paymentService";
import { getSessionUser } from "@/lib/auth/session";

function money(qar: string): string {
  const n = Number(qar);
  return Number.isFinite(n)
    ? `QAR ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : `QAR ${qar}`;
}

export default function InvoiceDetailPage() {
  const params = useParams<{ projectId: string; invoiceId: string }>();
  const projectId = params.projectId;
  const invoiceId = params.invoiceId;
  const user = getSessionUser();
  const roles = user?.roles ?? [];
  const canSubmit = roles.some((r) => ["Owner", "SystemAdmin", "Contractor"].includes(r));
  const canApprove = roles.some((r) => ["Owner", "SystemAdmin"].includes(r));
  const canFinance = roles.some((r) => ["Owner", "SystemAdmin", "Finance"].includes(r));
  const canPay = roles.some((r) => ["SystemAdmin", "Finance"].includes(r));

  const [inv, setInv] = useState<Invoice | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [payAmount, setPayAmount] = useState("");
  const [payRef, setPayRef] = useState("");
  const [payDate, setPayDate] = useState("2026-09-20");

  const reload = useCallback(async () => {
    if (!projectId || !invoiceId) return;
    setError(null);
    try {
      const [invoice, hist] = await Promise.all([
        getInvoice(projectId, invoiceId),
        listInvoicePayments(projectId, invoiceId)
      ]);
      setInv(invoice);
      setPayments(hist.payments);
      if (!payAmount) setPayAmount(invoice.outstandingAmount);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [projectId, invoiceId, payAmount]);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function run(action: () => Promise<Invoice>, okMsg: string) {
    setBusy(true);
    setError(null);
    try {
      setInv(await action());
      setFlash(okMsg);
      await reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function onRecordPayment() {
    if (!projectId || !invoiceId) return;
    setBusy(true);
    setError(null);
    try {
      const res = await recordPayment(projectId, invoiceId, {
        paymentDate: new Date(`${payDate}T00:00:00.000Z`).toISOString(),
        amount: payAmount,
        reference: payRef || `TXN-${Date.now()}`,
        method: "Bank Transfer"
      });
      setInv(res.invoice);
      setFlash(`Payment recorded · ${res.invoiceUpdate.newStatus}`);
      setPayRef("");
      const hist = await listInvoicePayments(projectId, invoiceId);
      setPayments(hist.payments);
      setPayAmount(res.invoiceUpdate.newOutstanding);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const payable = inv && (inv.status === "FinanceProcessing" || inv.status === "PartiallyPaid");

  return (
    <div className="opc-boq opc-wip">
      <p className="opc-tenders-back">
        <Link href={`/projects/${projectId}/invoices`}>← Invoice register</Link>
        {" · "}
        <Link href={`/projects/${projectId}/payments`}>Payments</Link>
      </p>
      {inv ? (
        <header className="opc-boq-page-head">
          <div>
            <h1 className="opc-boq-h1">{inv.invoiceNumber}</h1>
            <p className="opc-boq-lead">
              WIP #{inv.wipNumber ?? "—"} · {inv.status}
              {inv.isOverdue ? " · Overdue" : ""}
            </p>
          </div>
          <div className="opc-tenders-actions">
            {canSubmit && inv.status === "Draft" ? (
              <button
                type="button"
                className="opc-btn opc-btn--gold opc-progress-touch"
                disabled={busy}
                onClick={() => void run(() => submitInvoice(projectId, invoiceId), "Submitted")}
              >
                Submit
              </button>
            ) : null}
            {canApprove && inv.status === "Submitted" ? (
              <button
                type="button"
                className="opc-btn opc-btn--gold opc-progress-touch"
                disabled={busy}
                onClick={() => void run(() => approveInvoice(projectId, invoiceId), "Approved")}
              >
                Approve
              </button>
            ) : null}
            {canFinance && inv.status === "Approved" ? (
              <button
                type="button"
                className="opc-btn opc-progress-touch"
                disabled={busy}
                onClick={() => void run(() => moveInvoiceToFinance(projectId, invoiceId), "Moved to finance")}
              >
                Move to finance
              </button>
            ) : null}
          </div>
        </header>
      ) : null}

      {flash ? (
        <p className="opc-boq-banner opc-boq-banner--ok" role="status">
          {flash}
        </p>
      ) : null}
      {error ? <p className="opc-tenders-error">{error}</p> : null}

      {inv ? (
        <>
          <div className="opc-progress-kpis">
            <div className="opc-progress-kpi">
              <span>Gross</span>
              <strong>{money(inv.grossAmount)}</strong>
            </div>
            <div className="opc-progress-kpi">
              <span>Net</span>
              <strong>{money(inv.netAmount)}</strong>
            </div>
            <div className="opc-progress-kpi">
              <span>Outstanding</span>
              <strong>{money(inv.outstandingAmount)}</strong>
            </div>
          </div>
          <p className="opc-tenders-muted">
            Invoice {inv.invoiceDate?.slice(0, 10)} · Due {inv.dueDate?.slice(0, 10)}
            {inv.notes ? ` · ${inv.notes}` : ""}
          </p>

          {canPay && payable ? (
            <section className="opc-wip-create" style={{ marginTop: "1.5rem" }}>
              <h2 className="opc-boq-h1" style={{ fontSize: "1.1rem" }}>
                Record payment
              </h2>
              <label>
                Date
                <input type="date" className="opc-progress-touch" value={payDate} onChange={(e) => setPayDate(e.target.value)} />
              </label>
              <label>
                Amount (QAR)
                <input
                  className="opc-progress-touch"
                  inputMode="decimal"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                />
              </label>
              <label>
                Reference
                <input
                  className="opc-progress-touch"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  placeholder="TXN-…"
                />
              </label>
              <button
                type="button"
                className="opc-btn opc-btn--gold opc-progress-touch"
                disabled={busy}
                onClick={() => void onRecordPayment()}
              >
                Record payment
              </button>
            </section>
          ) : null}

          <div className="opc-tenders-table-wrap" style={{ marginTop: "1.5rem" }}>
            <h2 className="opc-boq-h1" style={{ fontSize: "1.1rem" }}>
              Payment history
            </h2>
            <table className="opc-boq-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Reference</th>
                  <th>Method</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td className="opc-tenders-muted">{p.paymentDate?.slice(0, 10)}</td>
                    <td>{p.reference}</td>
                    <td>{p.method}</td>
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

          {canApprove && ["Draft", "Submitted", "Approved"].includes(inv.status) ? (
            <section className="opc-wip-create" style={{ marginTop: "1.5rem" }}>
              <label>
                Rejection reason
                <input
                  className="opc-progress-touch"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Min 10 characters"
                />
              </label>
              <button
                type="button"
                className="opc-btn opc-progress-touch"
                disabled={busy}
                onClick={() =>
                  void run(() => rejectInvoice(projectId, invoiceId, rejectReason), "Rejected")
                }
              >
                Reject invoice
              </button>
            </section>
          ) : null}
        </>
      ) : !error ? (
        <DetailSkeleton />
      ) : null}
    </div>
  );
}
