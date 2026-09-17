"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { sessionHasRole } from "@/lib/auth/guards";
import { TableSkeleton } from "@/components/ui/Skeleton";
import {
  createOrganization,
  listOrganizations,
  type OrgRow
} from "@/lib/api/services/adminService";

const ORG_TYPES = ["Owner", "Consultant", "Contractor", "Internal"] as const;

export default function OrganizationsAdminPage() {
  const allowed = sessionHasRole("SystemAdmin");
  const [rows, setRows] = useState<OrgRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: "",
    type: "Owner",
    crNumber: "",
    email: "",
    phone: "",
    line1: "",
    city: "Doha",
    country: "Qatar"
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await listOrganizations());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (allowed) void load();
    else setLoading(false);
  }, [allowed, load]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await createOrganization({
        name: form.name,
        type: form.type,
        crNumber: form.crNumber,
        email: form.email,
        phone: form.phone,
        address: { line1: form.line1, city: form.city, country: form.country }
      });
      setForm({
        name: "",
        type: "Owner",
        crNumber: "",
        email: "",
        phone: "",
        line1: "",
        city: "Doha",
        country: "Qatar"
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setBusy(false);
    }
  }

  if (!allowed) {
    return (
      <main className="opc-admin">
        <p className="opc-admin-crumb">System / Organizations</p>
        <div className="opc-api-status-banner opc-api-status-banner-error">
          <span className="opc-pill opc-pill-danger">SystemAdmin role required</span>
        </div>
      </main>
    );
  }

  return (
    <main className="opc-admin">
      <p className="opc-admin-crumb">System / Organizations</p>
      <header className="opc-admin-header">
        <h1>Organizations</h1>
      </header>

      {error ? (
        <div className="opc-api-status-banner opc-api-status-banner-error">
          <span className="opc-pill opc-pill-danger">{error}</span>
        </div>
      ) : null}

      <form className="opc-admin-form" onSubmit={onCreate}>
        <h2>Register organization</h2>
        <div className="opc-admin-form-grid">
          <label>
            Name
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </label>
          <label>
            Type
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              {ORG_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label>
            CR Number
            <input
              required
              minLength={6}
              maxLength={20}
              value={form.crNumber}
              onChange={(e) => setForm({ ...form, crNumber: e.target.value })}
            />
          </label>
          <label>
            Email
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </label>
          <label>
            Phone
            <input
              required
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </label>
          <label>
            Address line
            <input
              required
              value={form.line1}
              onChange={(e) => setForm({ ...form, line1: e.target.value })}
            />
          </label>
        </div>
        <button className="opc-db-primary" type="submit" disabled={busy}>
          Create organization
        </button>
      </form>

      {loading ? <TableSkeleton rows={6} cols={5} /> : null}

      {!loading ? (
        <div className="opc-db-table-wrap opc-admin-table-wrap">
          <table className="opc-db-table opc-admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>CR</th>
                <th>Phone</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((o) => (
                <tr key={o.id}>
                  <td>{o.name}</td>
                  <td>
                    <span className="opc-pill opc-pill-success">{o.type}</span>
                  </td>
                  <td className="opc-admin-num">{o.crNumber ?? "—"}</td>
                  <td>{o.phone ?? "—"}</td>
                  <td>
                    {o.isActive ? (
                      <span className="opc-pill opc-pill-success">Active</span>
                    ) : (
                      <span className="opc-pill opc-pill-danger">Inactive</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <div className="opc-admin-cards" aria-label="Organizations mobile list">
        {rows.map((o) => (
          <article key={`c-${o.id}`} className="opc-admin-card">
            <strong>{o.name}</strong>
            <span className="opc-pill opc-pill-success">{o.type}</span>
            <div className="opc-admin-num">{o.crNumber}</div>
            {o.isActive ? (
              <span className="opc-pill opc-pill-success">Active</span>
            ) : (
              <span className="opc-pill opc-pill-danger">Inactive</span>
            )}
          </article>
        ))}
      </div>
    </main>
  );
}
