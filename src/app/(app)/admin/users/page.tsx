"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { sessionHasRole } from "@/lib/auth/guards";
import { ModalHead } from "@/components/ui/ModalHead";
import { TableSkeleton } from "@/components/ui/Skeleton";
import {
  activateUser,
  assignUserToProject,
  createUser,
  deactivateUser,
  listOrganizations,
  listUsers,
  type OrgRow,
  type UserRow
} from "@/lib/api/services/adminService";

const ROLES = ["SystemAdmin", "Owner", "Consultant", "Contractor", "Finance"] as const;

export default function UsersAdminPage() {
  const allowed = sessionHasRole("SystemAdmin");
  const [users, setUsers] = useState<UserRow[]>([]);
  const [orgs, setOrgs] = useState<OrgRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [orgFilter, setOrgFilter] = useState("");
  const [busy, setBusy] = useState(false);
  const [assign, setAssign] = useState<{ userId: string; projectId: string; role: string } | null>(
    null
  );
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "Consultant",
    orgId: ""
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [u, o] = await Promise.all([listUsers(), listOrganizations()]);
      setUsers(u);
      setOrgs(o);
      setForm((f) => (f.orgId ? f : { ...f, orgId: o[0]?.id ?? "" }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (allowed) void load();
    else setLoading(false);
  }, [allowed, load]);

  const orgName = useMemo(() => {
    const m = new Map(orgs.map((o) => [o.id, o]));
    return (id: string) => m.get(id);
  }, [orgs]);

  const filtered = users.filter((u) => {
    if (orgFilter && u.orgId !== orgFilter) return false;
    if (!q.trim()) return true;
    const s = q.toLowerCase();
    return u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s);
  });

  async function onProvision(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await createUser({
        name: form.name,
        email: form.email,
        password: form.password,
        roles: [form.role],
        orgId: form.orgId
      });
      setForm((f) => ({ ...f, name: "", email: "", password: "" }));
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Provision failed");
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(u: UserRow) {
    setBusy(true);
    setError(null);
    try {
      if (u.isActive) await deactivateUser(u.id);
      else await activateUser(u.id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }

  async function onAssign(e: FormEvent) {
    e.preventDefault();
    if (!assign) return;
    setBusy(true);
    setError(null);
    try {
      await assignUserToProject(assign.userId, assign.projectId, assign.role);
      setAssign(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Assign failed");
    } finally {
      setBusy(false);
    }
  }

  if (!allowed) {
    return (
      <main className="opc-admin">
        <p className="opc-admin-crumb">System / User Administration</p>
        <div className="opc-api-status-banner opc-api-status-banner-error">
          <span className="opc-pill opc-pill-danger">SystemAdmin role required</span>
        </div>
      </main>
    );
  }

  return (
    <main className="opc-admin">
      <p className="opc-admin-crumb">System / User Administration</p>
      <header className="opc-admin-header">
        <h1>Users & Project Access</h1>
      </header>

      {error ? (
        <div className="opc-api-status-banner opc-api-status-banner-error">
          <span className="opc-pill opc-pill-danger">{error}</span>
        </div>
      ) : null}

      <div className="opc-admin-toolbar">
        <input
          className="opc-admin-search"
          placeholder="Search name or email"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select value={orgFilter} onChange={(e) => setOrgFilter(e.target.value)}>
          <option value="">All organizations</option>
          {orgs.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
      </div>

      <form className="opc-admin-form" onSubmit={onProvision}>
        <h2>Provision user</h2>
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
            Email
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </label>
          <label>
            Temp password
            <input
              required
              type="password"
              minLength={12}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </label>
          <label>
            Role
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
          <label>
            Organization
            <select
              required
              value={form.orgId}
              onChange={(e) => setForm({ ...form, orgId: e.target.value })}
            >
              {orgs.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <button className="opc-db-primary" type="submit" disabled={busy}>
          Provision User
        </button>
      </form>

      {loading ? <TableSkeleton rows={6} cols={5} /> : null}

      {!loading ? (
        <div className="opc-db-table-wrap opc-admin-table-wrap">
          <table className="opc-db-table opc-admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Organization</th>
                <th>Roles</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                const org = orgName(u.orgId);
                return (
                  <tr key={u.id}>
                    <td>
                      <div>{u.name}</div>
                      <div className="opc-admin-muted">{u.email}</div>
                    </td>
                    <td>
                      <div>{org?.name ?? u.orgId}</div>
                      {org ? <span className="opc-pill opc-pill-success">{org.type}</span> : null}
                    </td>
                    <td>
                      {u.roles.map((r) => (
                        <span key={r} className="opc-pill opc-pill-success opc-admin-role">
                          {r}
                        </span>
                      ))}
                    </td>
                    <td>
                      {u.isActive ? (
                        <span className="opc-pill opc-pill-success">Active</span>
                      ) : (
                        <span className="opc-pill opc-pill-danger">Inactive</span>
                      )}
                    </td>
                    <td className="opc-admin-actions">
                      <button
                        type="button"
                        className="opc-admin-link"
                        disabled={busy}
                        onClick={() =>
                          setAssign({ userId: u.id, projectId: "", role: "Consultant" })
                        }
                      >
                        Manage Projects
                      </button>
                      <button
                        type="button"
                        className="opc-admin-link"
                        disabled={busy}
                        onClick={() => void toggleActive(u)}
                      >
                        {u.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}

      <div className="opc-admin-cards" aria-label="Users mobile list">
        {filtered.map((u) => (
          <article key={`c-${u.id}`} className="opc-admin-card">
            <strong>{u.name}</strong>
            <div className="opc-admin-muted">{u.email}</div>
            <span className="opc-pill opc-pill-success">{orgName(u.orgId)?.name ?? "Org"}</span>
            {u.isActive ? (
              <span className="opc-pill opc-pill-success">Active</span>
            ) : (
              <span className="opc-pill opc-pill-danger">Inactive</span>
            )}
          </article>
        ))}
      </div>

      {assign ? (
        <div className="opc-admin-drawer" role="dialog" aria-label="Assign project">
          <form onSubmit={onAssign}>
            <ModalHead title="Assign project" onClose={() => setAssign(null)} />
            <label>
              Project ID
              <input
                required
                value={assign.projectId}
                onChange={(e) => setAssign({ ...assign, projectId: e.target.value })}
                placeholder="24-char ObjectId"
              />
            </label>
            <label>
              Role
              <select
                value={assign.role}
                onChange={(e) => setAssign({ ...assign, role: e.target.value })}
              >
                {ROLES.filter((r) => r !== "SystemAdmin").map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>
            <div className="opc-admin-drawer-actions">
              <button type="button" className="opc-admin-link" onClick={() => setAssign(null)}>
                Cancel
              </button>
              <button className="opc-db-primary" type="submit" disabled={busy}>
                Assign
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </main>
  );
}
