"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ModalHead } from "@/components/ui/ModalHead";
import { ModalPortal } from "@/components/ui/ModalPortal";

export type AwardCandidate = {
  quotationId: string;
  contractorName: string;
  amount: string;
  durationDays: number;
};

type Props = {
  open: boolean;
  projectId: string;
  tenderId: string;
  candidate: AwardCandidate | null;
  onClose: () => void;
  onAwarded: (result: { contractReference: string; contractValue: string; contractId: string }) => void;
  awardFn: (
    projectId: string,
    tenderId: string,
    payload: {
      quotationId: string;
      contractReference: string;
      startDate: string;
      completionDate: string;
      retentionPct: number;
      advancePct: number;
      awardNotes: string;
      complianceOverride?: boolean;
    }
  ) => Promise<{ contractReference: string; contractValue: string; contractId: string }>;
};

function money(qar: string): string {
  const n = Number(qar);
  return Number.isFinite(n)
    ? `QAR ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : `QAR ${qar}`;
}

function toIsoDate(d: string): string {
  return new Date(`${d}T00:00:00.000Z`).toISOString();
}

export function AwardQuotationModal({
  open,
  projectId,
  tenderId,
  candidate,
  onClose,
  onAwarded,
  awardFn
}: Props) {
  const [reference, setReference] = useState("CNT-");
  const [startDate, setStartDate] = useState("2026-10-01");
  const [completionDate, setCompletionDate] = useState("2028-10-01");
  const [retentionPct, setRetentionPct] = useState("10");
  const [awardNotes, setAwardNotes] = useState("");
  const [override, setOverride] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open || !candidate) return null;

  async function submit() {
    if (!candidate) return;
    if (awardNotes.trim().length < 10) {
      setError("Award justification required (min 10 characters)");
      return;
    }
    if (new Date(completionDate) <= new Date(startDate)) {
      setError("Completion date must be after start date");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const payload: {
        quotationId: string;
        contractReference: string;
        startDate: string;
        completionDate: string;
        retentionPct: number;
        advancePct: number;
        awardNotes: string;
        complianceOverride?: boolean;
      } = {
        quotationId: candidate.quotationId,
        contractReference: reference.trim().toUpperCase(),
        startDate: toIsoDate(startDate),
        completionDate: toIsoDate(completionDate),
        retentionPct: Number(retentionPct) || 10,
        advancePct: 10,
        awardNotes: awardNotes.trim()
      };
      if (override) payload.complianceOverride = true;
      const result = await awardFn(projectId, tenderId, payload);
      onAwarded(result);
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <ModalPortal>
      <div className="opc-overlay opc-award-overlay" role="presentation" onClick={onClose}>
        <div
          className="opc-award-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="opc-award-title"
          onClick={(e) => e.stopPropagation()}
        >
          <ModalHead
            title="Award Tender & Form Contract"
            titleId="opc-award-title"
            eyebrow="Commercial procurement"
            onClose={onClose}
          />

          <div className="opc-award-summary">
            <p className="opc-award-org">{candidate.contractorName}</p>
            <p className="opc-award-amount">{money(candidate.amount)}</p>
            <p className="opc-award-duration">{candidate.durationDays} Days</p>
          </div>

          <label className="opc-field">
            Contract Reference
            <input
              value={reference}
              onChange={(e) => setReference(e.target.value.toUpperCase())}
              maxLength={30}
              required
            />
          </label>
          <div className="opc-award-dates">
            <label className="opc-field">
              Start Date
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
            </label>
            <label className="opc-field">
              Completion Date
              <input
                type="date"
                value={completionDate}
                onChange={(e) => setCompletionDate(e.target.value)}
                required
              />
            </label>
          </div>
          <label className="opc-field">
            Retention %
            <input
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={retentionPct}
              onChange={(e) => setRetentionPct(e.target.value)}
            />
          </label>
          <label className="opc-field">
            Award Justification
            <textarea
              rows={3}
              value={awardNotes}
              onChange={(e) => setAwardNotes(e.target.value)}
              minLength={10}
              required
            />
          </label>
          <label className="opc-award-override">
            <input type="checkbox" checked={override} onChange={(e) => setOverride(e.target.checked)} />
            Compliance override (expired CR / Trade Licence)
          </label>

          <p className="opc-award-warn">
            This action will seal the tender and create an active commercial contract. It cannot be undone.
          </p>
          {error ? <p className="opc-tenders-error">{error}</p> : null}

          <div className="opc-award-actions">
            <Button variant="secondary" onClick={onClose} disabled={busy}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => void submit()} disabled={busy}>
              Confirm Award &amp; Generate Contract
            </Button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
