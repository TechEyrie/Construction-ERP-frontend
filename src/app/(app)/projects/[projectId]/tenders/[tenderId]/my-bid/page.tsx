"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  listQuotations,
  patchQuotation,
  submitQuotation,
  type QuotationRow
} from "@/lib/api/services/quotationsService";
import { getTender, type TenderRow } from "@/lib/api/services/tendersService";
import { getSessionUser } from "@/lib/auth/session";

export default function MyBidPage() {
  const params = useParams<{ projectId: string; tenderId: string }>();
  const projectId = params.projectId;
  const tenderId = params.tenderId;
  const user = getSessionUser();
  const isContractor = user?.roles?.includes("Contractor");

  const [tender, setTender] = useState<TenderRow | null>(null);
  const [bid, setBid] = useState<QuotationRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [reference, setReference] = useState("QT-SEED-001");
  const [amount, setAmount] = useState("10000000.00");
  const [durationDays, setDurationDays] = useState(730);
  const [notes, setNotes] = useState("");

  const reload = useCallback(async () => {
    if (!projectId || !tenderId) return;
    setError(null);
    try {
      const t = await getTender(projectId, tenderId);
      setTender(t);
      try {
        const rows = await listQuotations(projectId, tenderId);
        const mine = rows[0] ?? null;
        setBid(mine);
        if (mine) {
          setReference(mine.reference);
          setAmount(mine.amount);
          setDurationDays(mine.durationDays);
          setNotes(mine.notes ?? "");
        }
      } catch {
        setBid(null);
      }
    } catch (e) {
      setError((e as Error).message);
    }
  }, [projectId, tenderId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const open = Boolean(
    tender?.status === "Issued" && tender.closingDate && new Date(tender.closingDate).getTime() > Date.now()
  );

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!projectId || !tenderId) return;
    setBusy(true);
    setError(null);
    try {
      if (bid) {
        await patchQuotation(projectId, tenderId, bid.id, { amount, durationDays, notes });
      } else {
        const payload: {
          reference: string;
          amount: string;
          currency: string;
          durationDays: number;
          notes?: string;
        } = { reference, amount, currency: "QAR", durationDays };
        if (notes.trim()) payload.notes = notes.trim();
        await submitQuotation(projectId, tenderId, payload);
      }
      await reload();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (!isContractor) {
    return (
      <div className="opc-tenders">
        <p className="opc-tenders-error">My Bid is for contractor accounts.</p>
        <Link href={`/projects/${projectId}/tenders/${tenderId}/compare`}>Open comparison →</Link>
      </div>
    );
  }

  return (
    <div className="opc-tenders opc-mybid">
      <p className="opc-tenders-back">
        <Link href={`/projects/${projectId}/tenders/${tenderId}`}>← Tender package</Link>
      </p>
      <h1 className="opc-tenders-h1">My Bid</h1>
      {tender ? (
        <p className="opc-tenders-lead">
          {tender.reference} · {tender.status} · closes {new Date(tender.closingDate).toLocaleString()}
          {tender.hoursUntilClose >= 0 ? ` · ${tender.hoursUntilClose}h left` : " · closed"}
        </p>
      ) : null}
      {error ? <p className="opc-tenders-error">{error}</p> : null}

      {bid && !open ? (
        <article className="opc-mybid-card">
          <p>
            <strong>{bid.reference}</strong>
          </p>
          <p className="opc-compare-amount">
            QAR {Number(bid.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <p>{bid.durationDays} days</p>
          {bid.notes ? <p className="opc-tenders-muted">{bid.notes}</p> : null}
        </article>
      ) : (
        <form className="opc-mybid-form" onSubmit={onSubmit}>
          {!bid ? (
            <label>
              Reference
              <input value={reference} onChange={(e) => setReference(e.target.value)} required disabled={!open} />
            </label>
          ) : null}
          <label>
            Lump-sum amount (QAR)
            <input value={amount} onChange={(e) => setAmount(e.target.value)} required disabled={!open} />
          </label>
          <label>
            Duration (days)
            <input
              type="number"
              min={1}
              value={durationDays}
              onChange={(e) => setDurationDays(Number(e.target.value))}
              required
              disabled={!open}
            />
          </label>
          <label>
            Notes
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} disabled={!open} />
          </label>
          <button type="submit" className="opc-btn opc-btn--gold" disabled={busy || !open}>
            {busy ? "Saving…" : bid ? "Update Proposal" : "Submit Proposal"}
          </button>
          {!open ? <p className="opc-tenders-muted">Bidding is closed for edits.</p> : null}
        </form>
      )}
    </div>
  );
}
