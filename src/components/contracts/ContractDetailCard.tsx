"use client";

import { StatusBadge, type BadgeStatus } from "@/components/ui/StatusBadge";

export type ContractView = {
  id: string;
  reference: string;
  originalContractAmount: string;
  currency: string;
  status: string;
  signedStatus: string;
  retentionPct: number;
  advancePct: number;
  awardDate: string;
  startDate: string;
  completionDate: string;
  durationDays: number;
  contractor: {
    id: string;
    name: string;
    crNumber: string | null;
    address: string | null;
  } | null;
  signedDocument: {
    id: string;
    fileName: string;
    checksum: string;
    uploadedAt: string;
    fileKey: string;
  } | null;
};

function money(currency: string, amount: string): string {
  const n = Number(amount);
  if (!Number.isFinite(n)) return `${currency} ${amount}`;
  return `${currency} ${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmt(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function signedTone(s: string): { status: BadgeStatus; label: string } {
  if (s === "FullySigned") return { status: "Valid", label: "Fully Signed" };
  if (s === "PartiallySigned") return { status: "UnderReview", label: "Partially Signed" };
  return { status: "Draft", label: "Unsigned" };
}

function contractTone(s: string): { status: BadgeStatus; label: string } {
  if (s === "Active") return { status: "Approved", label: "Active" };
  if (s === "Completed") return { status: "Paid", label: "Completed" };
  if (s === "Terminated") return { status: "Rejected", label: "Terminated" };
  return { status: "Draft", label: "Draft" };
}

type Props = {
  contract: ContractView;
  projectCode: string;
  ownerName?: string | null;
  onDownloadSigned?: () => void;
};

export function ContractDetailCard({
  contract,
  projectCode,
  ownerName,
  onDownloadSigned
}: Props) {
  const signed = signedTone(contract.signedStatus);
  const st = contractTone(contract.status);

  return (
    <div className="opc-contract">
      <header className="opc-contract-header">
        <div>
          <span className="opc-contract-code">{projectCode}</span>
          <h1 className="opc-contract-h1">{contract.reference}</h1>
          <div className="opc-contract-badges">
            <StatusBadge status={st.status} label={st.label} />
          </div>
        </div>
      </header>

      <div className="opc-contract-kpis">
        <article className="opc-contract-kpi opc-contract-kpi--hero">
          <p className="opc-contract-kpi-eyebrow">Original Contract Value</p>
          <p className="opc-contract-kpi-value opc-contract-kpi-value--gold">
            {money(contract.currency, contract.originalContractAmount)}
          </p>
        </article>
        <article className="opc-contract-kpi">
          <p className="opc-contract-kpi-eyebrow">Legal Agreement</p>
          <StatusBadge status={signed.status} label={signed.label} size="md" />
        </article>
        <article className="opc-contract-kpi">
          <p className="opc-contract-kpi-eyebrow">Retention Policy</p>
          <p className="opc-contract-kpi-h3">{contract.retentionPct.toFixed(1)}% Deduction</p>
          <p className="opc-contract-kpi-sub">Advance recovery {contract.advancePct.toFixed(1)}%</p>
        </article>
        <article className="opc-contract-kpi">
          <p className="opc-contract-kpi-eyebrow">Contract Duration</p>
          <p className="opc-contract-kpi-h3">{contract.durationDays} Days</p>
          <p className="opc-contract-kpi-sub">
            {fmt(contract.awardDate)} → {fmt(contract.completionDate)}
          </p>
        </article>
      </div>

      <section className="opc-contract-panel">
        <h2>Stakeholders</h2>
        <dl>
          <div>
            <dt>Awarded Contractor</dt>
            <dd>
              {contract.contractor?.name ?? "—"}
              {contract.contractor?.crNumber ? ` · CR ${contract.contractor.crNumber}` : ""}
              {contract.contractor?.address ? (
                <>
                  <br />
                  {contract.contractor.address}
                </>
              ) : null}
            </dd>
          </div>
          <div>
            <dt>Project Owner</dt>
            <dd>{ownerName ?? "—"}</dd>
          </div>
        </dl>
      </section>

      <section className="opc-contract-panel">
        <h2>Executed Agreement</h2>
        {contract.signedDocument ? (
          <div className="opc-contract-file">
            <div>
              <strong>{contract.signedDocument.fileName}</strong>
              <p>
                Uploaded {fmt(contract.signedDocument.uploadedAt)} · SHA-256{" "}
                {contract.signedDocument.checksum.slice(0, 16)}…
              </p>
            </div>
            {onDownloadSigned ? (
              <button type="button" className="opc-btn opc-btn--primary" onClick={onDownloadSigned}>
                Download Signed Contract
              </button>
            ) : null}
          </div>
        ) : (
          <p className="opc-contract-empty-doc">No executed agreement uploaded yet.</p>
        )}
      </section>
    </div>
  );
}
