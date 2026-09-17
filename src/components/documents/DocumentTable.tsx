"use client";

import type { DocumentRow } from "@/lib/api/services/documentsService";

type Props = {
  rows: DocumentRow[];
  onHistory: (row: DocumentRow) => void;
  onRevise: (row: DocumentRow) => void;
  downloadHref: (fileKey: string) => string;
  downloadAuth: string | null;
};

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  } catch {
    return iso;
  }
}

export function DocumentTable({ rows, onHistory, onRevise, downloadHref, downloadAuth }: Props) {
  async function download(fileKey: string, fileName: string) {
    const res = await fetch(downloadHref(fileKey), {
      headers: downloadAuth ? { Authorization: `Bearer ${downloadAuth}` } : {}
    });
    if (!res.ok) throw new Error(`Download failed (${res.status})`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="opc-docs-table-wrap">
      <table className="opc-docs-table">
        <thead>
          <tr>
            <th>Document</th>
            <th>Category</th>
            <th>Rev</th>
            <th>Signed</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className={row.isSuperseded ? "opc-docs-row--superseded" : undefined}>
              <td>
                <div className="opc-docs-title">{row.title}</div>
                <div className="opc-docs-filename">{row.fileName}</div>
              </td>
              <td>
                <span className="opc-docs-cat">{row.category}</span>
              </td>
              <td>
                <span className="opc-docs-rev">{row.revision}</span>
              </td>
              <td>
                {row.signedStatus ? (
                  <span
                    className={
                      row.signedStatus === "FullySigned"
                        ? "opc-docs-signed opc-docs-signed--full"
                        : "opc-docs-signed"
                    }
                  >
                    {row.signedStatus}
                  </span>
                ) : (
                  "—"
                )}
              </td>
              <td className="opc-docs-date">{fmtDate(row.documentDate)}</td>
              <td className="opc-docs-actions">
                <button
                  type="button"
                  className="opc-docs-action"
                  onClick={() => void download(row.fileKey, row.fileName)}
                >
                  Download
                </button>
                <button type="button" className="opc-docs-action" onClick={() => onHistory(row)}>
                  History
                </button>
                {!row.isSuperseded ? (
                  <button type="button" className="opc-docs-action" onClick={() => onRevise(row)}>
                    Revise
                  </button>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <ul className="opc-docs-cards">
        {rows.map((row) => (
          <li key={row.id} className="opc-docs-card">
            <div className="opc-docs-title">{row.title}</div>
            <div className="opc-docs-card-meta">
              <span className="opc-docs-cat">{row.category}</span>
              <span className="opc-docs-rev">{row.revision}</span>
            </div>
            <button
              type="button"
              className="opc-btn opc-btn--primary opc-docs-card-dl"
              onClick={() => void download(row.fileKey, row.fileName)}
            >
              Download
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
