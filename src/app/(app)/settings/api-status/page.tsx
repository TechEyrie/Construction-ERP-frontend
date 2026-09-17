"use client";

import { useEffect, useState } from "react";
import { fetchPublicConfig, fetchSchemaDiff } from "@/lib/api/client";
import { parseFrontendEnv } from "@/config/env";
import { toastFromApiError } from "@/components/feedback/GlobalToastContainer";
import { getAccessToken } from "@/lib/auth/session";
import { TableSkeleton } from "@/components/ui/Skeleton";

type Diff = {
  isSynchronized: boolean;
  registeredPathsCount: number;
  registeredSchemasCount: number;
  specHash: string;
  generatedAt: string;
};

export default function ApiStatusPage() {
  const env = parseFrontendEnv();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiEnv, setApiEnv] = useState<string>("");
  const [diff, setDiff] = useState<Diff | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const cfg = await fetchPublicConfig();
        if (cancelled) return;
        setApiEnv(cfg.environment);
        const token = getAccessToken();
        if (token) {
          try {
            const d = await fetchSchemaDiff(token);
            if (!cancelled) setDiff(d);
          } catch {
            if (!cancelled) setDiff(null);
          }
        } else if (!cancelled) {
          setDiff(null);
        }
      } catch {
        if (!cancelled) {
          setError("API Unreachable");
          toastFromApiError({
            message: "Verify NEXT_PUBLIC_API_BASE_URL and that opc-api is running.",
            code: "SERVICE_UNAVAILABLE",
            status: 503
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function demoToast() {
    toastFromApiError({
      message: "Simulated server failure for toast design check.",
      code: "INTERNAL_SERVER_ERROR",
      requestId: "req_toast_demo",
      status: 500
    });
  }

  return (
    <main className="opc-api-status">
      <h1 className="opc-api-status-title">API Contract & Integration Status</h1>
      <p className="opc-api-status-desc">
        Contract synchronization against {env.NEXT_PUBLIC_API_BASE_URL}
      </p>

      {loading ? <TableSkeleton rows={6} cols={5} /> : null}

      {error ? (
        <div className="opc-api-status-banner opc-api-status-banner-error">
          <span className="opc-pill opc-pill-danger">API Unreachable</span>
          <p>Verify NEXT_PUBLIC_API_BASE_URL and that opc-api is running.</p>
        </div>
      ) : null}

      {!loading && !error ? (
        <>
          <div className="opc-api-status-banner">
            <p>
              API environment: <strong>{apiEnv || "—"}</strong>
              {diff ? ` · ${diff.generatedAt}` : null}
            </p>
            <span className={diff?.isSynchronized ? "opc-pill opc-pill-success" : "opc-pill opc-pill-danger"}>
              {diff?.isSynchronized ? "SYNCHRONIZED" : "DIFF DETECTED"}
            </span>
          </div>

          <div className="opc-api-status-grid">
            <div className="opc-api-status-metric">
              <span>Registered Endpoints</span>
              <strong>{diff?.registeredPathsCount ?? "—"}</strong>
            </div>
            <div className="opc-api-status-metric">
              <span>Registered Schemas</span>
              <strong>{diff?.registeredSchemasCount ?? "—"}</strong>
            </div>
            <div className="opc-api-status-metric">
              <span>Spec Checksum</span>
              <strong className="opc-mono">{diff?.specHash?.slice(0, 18) ?? "—"}</strong>
            </div>
          </div>

          <a className="opc-api-status-download" href={`${env.NEXT_PUBLIC_API_BASE_URL}/openapi.json`}>
            Download OpenAPI Spec
          </a>
        </>
      ) : null}

      {!loading ? (
        <p style={{ marginTop: 16 }}>
          <button type="button" className="opc-api-status-download" onClick={demoToast}>
            Demo Error Toast
          </button>
        </p>
      ) : null}
    </main>
  );
}
