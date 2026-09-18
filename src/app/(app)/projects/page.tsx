"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PortfolioSkeleton } from "@/components/ui/Skeleton";
import { logout } from "@/lib/auth/api";
import { getAccessToken, getSessionUser, isAccessTokenExpired } from "@/lib/auth/session";
import { listProjects, type ProjectRow } from "@/lib/api/services/projectsService";

function formatMoney(currency: string, amount: string): string {
  const n = Number(amount);
  if (!Number.isFinite(n)) return `${currency} ${amount}`;
  return `${currency} ${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function statusTone(status: string): string {
  switch (status) {
    case "Active":
      return "opc-badge--approved";
    case "Planning":
      return "opc-badge--pending";
    case "Completed":
      return "opc-badge--success";
    case "OnHold":
      return "opc-badge--warning";
    default:
      return "opc-badge--draft";
  }
}

export default function ProjectsPortfolioPage() {
  const router = useRouter();
  const [canCreate, setCanCreate] = useState(false);
  const [rows, setRows] = useState<ProjectRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [initials, setInitials] = useState("?");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const token = getAccessToken();
    if (!token || isAccessTokenExpired()) {
      router.replace("/login");
      return;
    }
    const user = getSessionUser();
    setCanCreate(Boolean(user?.roles.some((r) => r === "SystemAdmin" || r === "Owner")));
    setInitials((user?.name ?? "?").slice(0, 2).toUpperCase());
    void listProjects()
      .then(setRows)
      .catch((e: Error) => {
        setError(e.message);
        setRows([]);
      });
  }, [router]);

  async function onLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <div className="opc-portfolio-shell">
      <header className="opc-shell-header opc-portfolio-topnav">
        <Link href="/projects" className="opc-shell-brand" title="Yamaloon">
          <span className="opc-shell-mark" aria-hidden>
            ◆
          </span>
          <span className="opc-shell-brand-name">Yamaloon</span>
        </Link>
        <div className="opc-shell-header-right">
          <div className="opc-shell-avatar-wrap">
            <button
              type="button"
              className="opc-shell-avatar"
              aria-label="Account menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              {initials}
            </button>
            {menuOpen ? (
              <div className="opc-shell-menu" role="menu">
                <button type="button" role="menuitem" onClick={() => void onLogout()}>
                  Logout
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <main className="opc-portfolio">
        <header className="opc-portfolio-header">
          <div>
            <h1 className="opc-portfolio-title">Project Portfolio</h1>
            <p className="opc-portfolio-lead">Capital projects under owner control.</p>
          </div>
          {canCreate ? (
            <Button variant="primary" onClick={() => router.push("/projects/new")}>
              New Project
            </Button>
          ) : null}
        </header>

        {error ? (
          <p className="opc-auth-error" role="alert">
            {error}
          </p>
        ) : null}

        {rows === null ? (
          <PortfolioSkeleton />
        ) : rows.length === 0 ? (
          canCreate ? (
            <EmptyState
              title="No assigned projects"
              description="Contact your administrator to receive project permissions."
              actionLabel="Create project"
              onAction={() => router.push("/projects/new")}
            />
          ) : (
            <EmptyState
              title="No assigned projects"
              description="Contact your administrator to receive project permissions."
            />
          )
        ) : (
          <ul className="opc-portfolio-grid">
            {rows.map((p) => (
              <li key={p.id}>
                <Link className="opc-portfolio-card-rich" href={`/projects/${p.id}`}>
                  <div className="opc-portfolio-card-top">
                    <span className="opc-psel-code">{p.code}</span>
                    <span className={`opc-badge ${statusTone(p.status)}`}>{p.status}</span>
                  </div>
                  <h2 className="opc-portfolio-card-name">{p.name}</h2>
                  <dl className="opc-portfolio-metrics">
                    <div>
                      <dt>Contract Value</dt>
                      <dd className="opc-tabular opc-portfolio-money">
                        {formatMoney(p.currency, p.contractValue)}
                      </dd>
                    </div>
                    <div>
                      <dt>Location</dt>
                      <dd>{p.location}</dd>
                    </div>
                  </dl>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
