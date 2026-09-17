"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ModalHead } from "@/components/ui/ModalHead";
import { ModalPortal } from "@/components/ui/ModalPortal";
import { lockBoqBaseline, type BoqSummary } from "@/lib/api/services/boqService";

type Props = {
  open: boolean;
  projectId: string;
  summary: BoqSummary;
  onClose: () => void;
  onLocked: () => void;
};

export function LockBaselineModal({ open, projectId, summary, onClose, onLocked }: Props) {
  const [reason, setReason] = useState("");
  const [ack, setAck] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const needsAck = summary.hasContractValueMismatch;

  async function submit() {
    if (needsAck && (!ack || reason.trim().length < 3)) {
      setError("Acknowledge variance and provide a reason (min 3 chars)");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const payload: { mismatchAcknowledged?: boolean; mismatchReason?: string } = {
        mismatchAcknowledged: needsAck ? ack : false
      };
      if (needsAck) payload.mismatchReason = reason.trim();
      await lockBoqBaseline(projectId, payload);
      onLocked();
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
        <div className="opc-boq-lock-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
          <ModalHead title="Lock BOQ Baseline" onClose={onClose} />
          <p className="opc-boq-lead">
            This freezes all quantities and rates. It cannot be undone in Phase 01.
          </p>
          <p className="opc-boq-num">
            BOQ {summary.totalBoqAmount} · Contract {summary.contractValue} · Δ {summary.varianceAmount} (
            {summary.variancePercentage}%)
          </p>
          {needsAck ? (
            <>
              <p className="opc-boq-banner opc-boq-banner--warn">
                Variance must be acknowledged before lock.
              </p>
              <label className="opc-award-override">
                <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} />
                I acknowledge the contract value mismatch
              </label>
              <label className="opc-field">
                Reason
                <textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
              </label>
            </>
          ) : null}
          {error ? <p className="opc-tenders-error">{error}</p> : null}
          <div className="opc-boq-actions">
            <Button variant="secondary" onClick={onClose} disabled={busy}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => void submit()} disabled={busy}>
              Confirm Baseline Lock
            </Button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
