"use client";

import { useState } from "react";
import { FileUploadZone } from "@/components/files/FileUploadZone";
import { Button } from "@/components/ui/Button";
import {
  commitBoqImport,
  downloadBoqTemplate,
  validateBoqImport,
  type BoqValidationReport
} from "@/lib/api/services/boqService";

type Props = {
  projectId: string;
  onCommitted: () => void;
};

function money(qar: string): string {
  const n = Number(qar);
  return Number.isFinite(n)
    ? `QAR ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : `QAR ${qar}`;
}

export function BoqImportWizard({ projectId, onCommitted }: Props) {
  const [report, setReport] = useState<BoqValidationReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onFile(file: File) {
    setError(null);
    setReport(null);
    const r = await validateBoqImport(projectId, file);
    setReport(r);
  }

  async function onCommit() {
    if (!report?.fileKey || !report.isValid) return;
    setBusy(true);
    setError(null);
    try {
      await commitBoqImport(projectId, report.fileKey, true);
      setReport(null);
      onCommitted();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="opc-boq-wizard">
      <header className="opc-boq-wizard-head">
        <p className="opc-boq-eyebrow">COMMERCIAL BOQ</p>
        <h2 className="opc-boq-wizard-title">Import Bill of Quantities</h2>
        <Button
          variant="secondary"
          onClick={() => void downloadBoqTemplate(projectId, "xlsx").catch((e) => setError((e as Error).message))}
        >
          Download Official Template (.xlsx)
        </Button>
      </header>

      <FileUploadZone accept=".xlsx,.csv" hint="Excel (.xlsx) or CSV · max 10 MB" onFile={onFile} />

      {error ? <p className="opc-tenders-error">{error}</p> : null}

      {report ? (
        <div className="opc-boq-results">
          <div className="opc-boq-pills">
            <span>Rows {report.totalRowsScanned}</span>
            <span>Valid {report.validRowsCount}</span>
            <span className={report.errorRowsCount ? "opc-boq-pill--bad" : undefined}>
              Errors {report.errorRowsCount}
            </span>
          </div>

          {report.hasContractValueMismatch ? (
            <p className="opc-boq-banner opc-boq-banner--warn" role="status">
              Warning: Total BOQ value ({money(report.totalImportValue)}) differs from Contract Value (
              {money(report.contractValue)}) by {money(report.valueVariance)}. Saving is permitted.
            </p>
          ) : report.isValid ? (
            <p className="opc-boq-banner opc-boq-banner--ok" role="status">
              BOQ Total matches Contract Value exactly ({money(report.contractValue)}).
            </p>
          ) : null}

          {report.errors.length ? (
            <table className="opc-boq-table opc-boq-table--errors">
              <thead>
                <tr>
                  <th>Row</th>
                  <th>Item Code</th>
                  <th>Error</th>
                </tr>
              </thead>
              <tbody>
                {report.errors.map((e, i) => (
                  <tr key={`${e.rowNumber}-${i}`}>
                    <td>{e.rowNumber}</td>
                    <td>{e.itemCode || "—"}</td>
                    <td>{e.issue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}

          {report.previewRows.length ? (
            <table className="opc-boq-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Description</th>
                  <th>Qty</th>
                  <th>Rate</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {report.previewRows.map((r) => (
                  <tr key={r.itemCode}>
                    <td>{r.itemCode}</td>
                    <td>{r.description}</td>
                    <td className="opc-boq-num">{r.contractQty}</td>
                    <td className="opc-boq-num">{r.unitRate}</td>
                    <td className="opc-boq-num">{r.boqAmount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}

          <div className="opc-boq-actions">
            <Button variant="secondary" onClick={() => setReport(null)} disabled={busy}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={!report.isValid || !report.fileKey || busy}
              onClick={() => void onCommit()}
            >
              Commit BOQ Import
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
