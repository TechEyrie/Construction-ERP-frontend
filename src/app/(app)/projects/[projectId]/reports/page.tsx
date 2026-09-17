"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { isAbortError } from "@/lib/api/abort";
import {
  downloadReport,
  getReportPreview,
  listProjectReports,
  type ReportCatalogItem,
  type ReportPreview
} from "@/lib/api/services/reportsService";
import { useAbortableLoad } from "@/lib/hooks/useAbortableLoad";

export default function ProjectReportsPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId;
  const [catalog, setCatalog] = useState<ReportCatalogItem[] | null>(null);
  const [preview, setPreview] = useState<ReportPreview | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useAbortableLoad([projectId], async (signal) => {
    if (!projectId) return;
    try {
      const d = await listProjectReports(projectId, { signal });
      if (signal.aborted) return;
      setCatalog(d.reports);
      setError(null);
    } catch (e) {
      if (isAbortError(e) || signal.aborted) return;
      setError((e as Error).message);
      setCatalog([]);
    }
  });

  async function onPreview(key: string) {
    if (!projectId) return;
    setBusy(`preview:${key}`);
    setError(null);
    try {
      setPreview(await getReportPreview(projectId, key, 25));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to generate report.");
    } finally {
      setBusy(null);
    }
  }

  async function onDownload(key: string, format: "csv" | "xlsx") {
    if (!projectId) return;
    setBusy(`${format}:${key}`);
    setError(null);
    try {
      await downloadReport(projectId, key, format);
    } catch (e) {
      const err = e as Error & { status?: number };
      setError(
        err.status === 413
          ? "Narrow your date range — report exceeds 50,000 rows."
          : err.message || "Unable to generate report."
      );
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="opc-reports">
      <header className="opc-reports-header">
        <h1 className="opc-reports-title">Reports &amp; Exports</h1>
        <p className="opc-reports-lead">Synchronous CSV / Excel downloads and print views.</p>
      </header>

      {error ? (
        <p className="opc-auth-error" role="alert">
          {error}
        </p>
      ) : null}

      {catalog === null ? (
        <TableSkeleton rows={4} cols={3} />
      ) : (
      <ul className="opc-reports-grid">
        {catalog.map((r) => (
          <li key={r.key} className={`opc-reports-card${!r.accessible ? " opc-reports-card--locked" : ""}`}>
            <h2>{r.title}</h2>
            <p>{r.description}</p>
            <p className="opc-reports-badges">
              {r.allowedFormats.map((f) => (
                <span key={f}>{f.toUpperCase()}</span>
              ))}
            </p>
            {r.accessible ? (
              <div className="opc-reports-actions">
                <button
                  type="button"
                  className="opc-btn"
                  disabled={busy !== null}
                  onClick={() => void onPreview(r.key)}
                >
                  Preview
                </button>
                <button
                  type="button"
                  className="opc-btn opc-btn--gold"
                  data-opc-write="true"
                  disabled={busy !== null}
                  onClick={() => void onDownload(r.key, "csv")}
                >
                  Download CSV
                </button>
                <button
                  type="button"
                  className="opc-btn"
                  data-opc-write="true"
                  disabled={busy !== null}
                  onClick={() => void onDownload(r.key, "xlsx")}
                >
                  Download Excel
                </button>
                <Link className="opc-btn" href={`/projects/${projectId}/reports/${r.key}`}>
                  Print view
                </Link>
              </div>
            ) : (
              <p className="opc-tenders-muted">Not available for your role.</p>
            )}
          </li>
        ))}
      </ul>
      )}

      {preview ? (
        <section className="opc-reports-preview" aria-label="Report preview">
          <header>
            <h2>
              {preview.reportKey} · {preview.rowCount} rows
            </h2>
            <button type="button" className="opc-btn" onClick={() => setPreview(null)}>
              Close
            </button>
          </header>
          <p className="opc-tenders-muted">
            {preview.projectCode} · {preview.currency} · as of {preview.asOf.slice(0, 19)} UTC
          </p>
          {preview.rows.length === 0 ? (
            <p>No rows for the selected filters.</p>
          ) : (
            <div className="opc-reports-table-wrap">
              <table className="opc-reports-table">
                <thead>
                  <tr>
                    {preview.columns.map((c) => (
                      <th key={c}>{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.map((row, i) => (
                    <tr key={i}>
                      {preview.columns.map((c) => (
                        <td key={c}>{row[c] == null ? "" : String(row[c])}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {preview.footnotes.length > 0 ? (
            <ul className="opc-reports-notes">
              {preview.footnotes.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
