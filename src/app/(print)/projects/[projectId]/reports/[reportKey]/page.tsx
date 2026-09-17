"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { PageLoader } from "@/components/ui/Skeleton";
import {
  ackReportPrint,
  getReportPreview,
  type ReportPreview
} from "@/lib/api/services/reportsService";
import { getAccessToken } from "@/lib/auth/session";

export default function PrintReportPage() {
  return (
    <Suspense fallback={<PageLoader label="Preparing report…" />}>
      <PrintReportContent />
    </Suspense>
  );
}

function PrintReportContent() {
  const params = useParams<{ projectId: string; reportKey: string }>();
  const search = useSearchParams();
  const [data, setData] = useState<ReportPreview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params.projectId || !params.reportKey || !getAccessToken()) return;
    void getReportPreview(params.projectId, params.reportKey, 500)
      .then(async (preview) => {
        setData(preview);
        try {
          await ackReportPrint(params.projectId, params.reportKey);
        } catch {
          /* ignore */
        }
        if (search.get("autoprint") === "1") {
          window.setTimeout(() => window.print(), 400);
        }
      })
      .catch((e: Error) => setError(e.message));
  }, [params.projectId, params.reportKey, search]);

  if (error) {
    return (
      <main className="opc-print-report">
        <p role="alert">{error}</p>
      </main>
    );
  }
  if (!data) {
    return (
      <main className="opc-print-report">
        <PageLoader label="Preparing report…" />
      </main>
    );
  }

  return (
    <main className="opc-print-report">
      <header className="opc-print-report-head">
        <div>
          <p className="opc-print-report-eyebrow">{data.projectCode}</p>
          <h1>{data.projectName}</h1>
          <p>
            {data.reportKey} · {data.currency} · {data.asOf.slice(0, 19)} UTC
          </p>
        </div>
        <button type="button" className="opc-print-report-btn" onClick={() => window.print()}>
          Print / Save as PDF
        </button>
      </header>

      {data.rows.length === 0 ? (
        <p>No rows for the selected filters.</p>
      ) : (
        <table className="opc-print-report-table">
          <thead>
            <tr>
              {data.columns.map((c) => (
                <th key={c}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, i) => (
              <tr key={i}>
                {data.columns.map((c) => (
                  <td key={c}>{row[c] == null ? "" : String(row[c])}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {data.footnotes.length > 0 ? (
        <footer className="opc-print-report-notes">
          {data.footnotes.map((f) => (
            <p key={f}>{f}</p>
          ))}
        </footer>
      ) : null}
    </main>
  );
}
