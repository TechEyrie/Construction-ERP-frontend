"use client";

import { useCallback, useEffect, useState } from "react";
import { getApiBaseUrl } from "@/lib/api/baseUrl";
import { getAccessToken } from "@/lib/auth/session";
import { TableSkeleton } from "@/components/ui/Skeleton";

type CollectionStat = { name: string; documentsCount: number; indexesCount: number };
type MigrationRow = {
  version: string;
  name: string;
  durationMs: number;
  status: string;
  appliedAt: string;
};
type DbStatus = {
  databaseName: string;
  connectionStatus: string;
  storageDriver: string;
  collectionsCount: number;
  appliedMigrationsCount: number;
  latestMigration: string | null;
  collections: CollectionStat[];
  migrations: MigrationRow[];
};

export default function DatabaseAdminPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<DbStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const token = getAccessToken();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    if (!token) {
      setError("Sign in as SystemAdmin required");
      setStatus(null);
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/v1/admin/database/status`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include"
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: unknown = await res.json();
      const data = (json as { data?: DbStatus }).data;
      if (!data) throw new Error("empty");
      setStatus(data);
    } catch {
      setError("API Unreachable or forbidden");
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  async function runMigrations() {
    if (!token) return;
    setBusy(true);
    try {
      await fetch(`${getApiBaseUrl()}/api/v1/admin/database/migrate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({ targetVersion: "latest" })
      });
      await load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="opc-db-admin">
      <p className="opc-db-admin-crumb">Admin / Database Maintenance</p>
      <header className="opc-db-admin-header">
        <h1>Database Architecture & Migrations</h1>
      </header>

      {loading ? <TableSkeleton rows={6} cols={5} /> : null}

      {error ? (
        <div className="opc-api-status-banner opc-api-status-banner-error">
          <span className="opc-pill opc-pill-danger">{error}</span>
        </div>
      ) : null}

      {!loading && status ? (
        <>
          <div className="opc-db-kpi">
            <div className="opc-api-status-metric">
              <span>Active Collections</span>
              <strong className="opc-db-kpi-num">{status.collectionsCount}</strong>
            </div>
            <div className="opc-api-status-metric">
              <span>Connection Status</span>
              <span className="opc-pill opc-pill-success">{status.connectionStatus}</span>
            </div>
            <div className="opc-api-status-metric">
              <span>Applied Migrations</span>
              <strong className="opc-db-kpi-num">{status.appliedMigrationsCount}</strong>
            </div>
            <div className="opc-api-status-metric">
              <span>Database Storage Driver</span>
              <strong className="opc-mono">{status.storageDriver}</strong>
            </div>
          </div>

          <div className="opc-db-actions">
            <button type="button" className="opc-db-primary" disabled={busy} onClick={() => void runMigrations()}>
              Run Pending Migrations
            </button>
          </div>

          <div className="opc-db-table-wrap">
            <table className="opc-db-table">
              <thead>
                <tr>
                  <th>Version</th>
                  <th>Name</th>
                  <th>Execution Time</th>
                  <th>Status</th>
                  <th>Applied At</th>
                </tr>
              </thead>
              <tbody>
                {status.migrations.length === 0 ? (
                  <tr>
                    <td colSpan={5}>No migrations recorded</td>
                  </tr>
                ) : (
                  status.migrations.map((m) => (
                    <tr key={m.version}>
                      <td className="opc-mono">{m.version}</td>
                      <td>{m.name}</td>
                      <td>{m.durationMs} ms</td>
                      <td>
                        <span className="opc-pill opc-pill-success">{m.status}</span>
                      </td>
                      <td>{new Date(m.appliedAt).toISOString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </main>
  );
}
