"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { CommercialFunnel } from "@/components/dashboard/CommercialFunnel";
import { RadialGauge } from "@/components/dashboard/RadialGauge";
import { TrendChart } from "@/components/dashboard/TrendChart";
import { DashboardSkeleton } from "@/components/ui/Skeleton";
import { isAbortError } from "@/lib/api/abort";
import {
  getProjectDashboard,
  attentionCategoryLabel,
  type DashboardPayload
} from "@/lib/api/services/dashboardService";
import { useAbortableLoad } from "@/lib/hooks/useAbortableLoad";
import { readWorkspace } from "@/lib/project/workspaceCache";
import { getProjectHint } from "@/lib/project/projectHint";

function money(currency: string, amount: string | null, compact = false): string {
  if (amount == null) return "—";
  const n = Number(amount);
  if (!Number.isFinite(n)) return amount;
  if (compact) {
    const abs = Math.abs(n);
    if (abs >= 1_000_000) return `${currency} ${(n / 1_000_000).toFixed(2)}M`;
    if (abs >= 1_000) return `${currency} ${(n / 1_000).toFixed(0)}k`;
  }
  return `${currency} ${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

function num(v: string | null | undefined): number {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function pctOf(part: string | null | undefined, whole: string | null | undefined): number {
  const w = num(whole);
  if (w <= 0) return 0;
  return Math.min(100, (num(part) / w) * 100);
}

export default function ProjectDashboardPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId;
  const [dash, setDash] = useState<DashboardPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useAbortableLoad([projectId], async (signal) => {
    if (!projectId) return;
    try {
      setDash(await getProjectDashboard(projectId, { signal }));
      setError(null);
    } catch (e) {
      if (isAbortError(e) || signal.aborted) return;
      setError((e as Error).message);
    }
  });

  const kpis = useMemo(() => {
    if (!dash) return [];
    const k = dash.kpis;
    const cur = dash.currency;
    const contract = num(k.contractValue);
    return [
      {
        id: "contract",
        eyebrow: "Contract value",
        value: money(cur, k.contractValue, true),
        meta: dash.projectStatus,
        fill: 100,
        tone: "gold" as const
      },
      {
        id: "progress",
        eyebrow: "Physical progress",
        value: k.physicalProgressPct == null ? "—" : `${Number(k.physicalProgressPct).toFixed(1)}%`,
        meta: money(cur, k.completedValue, true),
        fill: num(k.physicalProgressPct),
        tone: "emerald" as const
      },
      {
        id: "certified",
        eyebrow: "Certified",
        value: money(cur, k.cumulativeCertified, true),
        meta: k.certifiedPctOfContract ? `${k.certifiedPctOfContract}% of contract` : "—",
        fill: num(k.certifiedPctOfContract),
        tone: "ink" as const
      },
      {
        id: "invoiced",
        eyebrow: "Invoiced",
        value: money(cur, k.cumulativeInvoiced, true),
        meta: k.invoicedPctOfContract ? `${k.invoicedPctOfContract}% of contract` : "—",
        fill: num(k.invoicedPctOfContract),
        tone: "ink" as const
      },
      {
        id: "paid",
        eyebrow: "Paid",
        value: money(cur, k.cumulativePaid, true),
        meta: k.paidPctOfContract ? `${k.paidPctOfContract}% of contract` : "—",
        fill: num(k.paidPctOfContract),
        tone: "emerald" as const
      },
      {
        id: "funding",
        eyebrow: "Funding drawn",
        value: money(cur, k.fundingDrawn, true),
        meta: k.fundingRemaining != null ? `Remain ${money(cur, k.fundingRemaining, true)}` : "—",
        fill: num(k.fundingDrawnPctOfApproved),
        tone: "gold" as const
      },
      {
        id: "liquidity",
        eyebrow: "Liquidity buffer",
        value: money(cur, k.netLiquidityBuffer, true),
        meta: k.isLiquidityDeficit ? "Deficit — act now" : "Healthy headroom",
        fill: contract > 0 ? Math.min(100, Math.abs(num(k.netLiquidityBuffer)) / contract * 100) : 0,
        tone: (k.isLiquidityDeficit ? "danger" : "emerald") as "danger" | "emerald"
      }
    ];
  }, [dash]);

  const signals = useMemo(() => {
    if (!dash) return [];
    const k = dash.kpis;
    const cur = dash.currency;
    const cert = num(k.cumulativeCertified);
    const paid = num(k.cumulativePaid);
    const inv = num(k.cumulativeInvoiced);
    const gap = Math.max(0, cert - paid);
    const collection = inv > 0 ? (paid / inv) * 100 : 0;
    const pts = dash.trends?.points ?? [];
    const last = pts[pts.length - 1];
    const prev = pts[pts.length - 2];
    const lastCert = num(last?.certifiedValue);
    const prevCert = num(prev?.certifiedValue);
    const mom = lastCert - prevCert;
    return [
      {
        id: "gap",
        label: "Cert ↔ paid gap",
        value: money(cur, String(gap), true),
        meta: gap > 0 ? "Cash still outstanding" : "Fully collected"
      },
      {
        id: "collect",
        label: "Collection rate",
        value: `${collection.toFixed(1)}%`,
        meta: "Paid / invoiced"
      },
      {
        id: "mom",
        label: "Cert MoM",
        value: mom === 0 ? "—" : money(cur, String(mom), true),
        meta: last ? `vs prior month` : "No trend yet"
      },
      {
        id: "fund",
        label: "Funding headroom",
        value: money(cur, k.fundingRemaining, true),
        meta: k.fundingDrawnPctOfApproved
          ? `${k.fundingDrawnPctOfApproved}% drawn`
          : "Approved facility"
      }
    ];
  }, [dash]);

  if (error) {
    return (
      <div className="opc-command-dash">
        <p className="opc-auth-error" role="alert">
          {error}
        </p>
      </div>
    );
  }

  if (!dash) {
    const cached =
      (projectId ? getProjectHint(projectId) : null) ??
      (projectId ? readWorkspace(projectId)?.current : null);
    return (
      <div className="opc-command-dash" aria-busy="true">
        <header className="opc-command-hero">
          <div className="opc-command-hero__veil" aria-hidden />
          <div className="opc-command-hero__beam" aria-hidden />
          <div className="opc-command-hero__copy">
            <p className="opc-command-hero__eyebrow">
              <span className="opc-command-hero__live" aria-hidden />
              <span>{cached?.projectCode ?? "…"}</span>
              <span className="opc-command-hero__dot" />
              <span>{cached?.role ?? "…"} view</span>
            </p>
            <h1 className="opc-command-hero__title">{cached?.projectName ?? "Project"}</h1>
            <p className="opc-command-hero__lead">
              Loading live commercial command surface…
            </p>
          </div>
        </header>
        <DashboardSkeleton />
      </div>
    );
  }

  const k = dash.kpis;
  const cur = dash.currency;
  const progress = num(k.physicalProgressPct);
  const elapsed = num(k.timeElapsedPct);
  const danger = dash.attention.countBySeverity.danger;
  const warn = dash.attention.countBySeverity.warning;

  const funnel = [
    { id: "c", label: "Contract", amount: num(k.contractValue), tone: "contract" as const },
    { id: "cert", label: "Certified", amount: num(k.cumulativeCertified), tone: "cert" as const },
    { id: "inv", label: "Invoiced", amount: num(k.cumulativeInvoiced), tone: "invoice" as const },
    { id: "paid", label: "Paid", amount: num(k.cumulativePaid), tone: "paid" as const },
    { id: "fund", label: "Funding drawn", amount: num(k.fundingDrawn), tone: "funding" as const }
  ];

  const paidPct = pctOf(k.cumulativePaid, k.contractValue);
  const stackMax = Math.max(
    1,
    num(k.outstandingInvoiceBalance),
    num(k.outstandingCertifiedNotPaid),
    Math.abs(num(k.netLiquidityBuffer)),
    num(k.fundingRemaining)
  );
  const cashStack = [
    {
      id: "inv",
      label: "Outstanding invoices",
      amount: num(k.outstandingInvoiceBalance),
      tone: "invoice" as const
    },
    {
      id: "cert",
      label: "Certified not paid",
      amount: num(k.outstandingCertifiedNotPaid),
      tone: "cert" as const
    },
    {
      id: "buf",
      label: "Net buffer",
      amount: Math.abs(num(k.netLiquidityBuffer)),
      tone: (k.isLiquidityDeficit ? "danger" : "buffer") as "danger" | "buffer"
    },
    {
      id: "fund",
      label: "Funding remaining",
      amount: num(k.fundingRemaining),
      tone: "funding" as const
    }
  ];
  const ringC = 2 * Math.PI * 48;
  const ringOffset = ringC * (1 - Math.min(1, paidPct / 100));

  return (
    <div className="opc-command-dash">
      <header className="opc-command-hero">
        <div className="opc-command-hero__veil" aria-hidden />
        <div className="opc-command-hero__beam" aria-hidden />
        <div className="opc-command-hero__copy">
          <p className="opc-command-hero__eyebrow">
            <span className="opc-command-hero__live" aria-hidden />
            <span>{dash.projectCode}</span>
            <span className="opc-command-hero__dot" />
            <span>{dash.viewerRoleProjection} view</span>
          </p>
          <h1 className="opc-command-hero__title">{dash.projectName}</h1>
          <p className="opc-command-hero__lead">
            Live commercial command surface — progress, certification, cash, and funding in one glance.
          </p>
          <div className="opc-command-hero__pills">
            <span className="opc-command-pill">{dash.projectStatus}</span>
            <span className="opc-command-pill opc-command-pill--muted">
              As of {dash.asOf.slice(0, 16).replace("T", " ")} UTC
            </span>
            {danger > 0 ? (
              <span className="opc-command-pill opc-command-pill--danger">{danger} critical</span>
            ) : null}
            {warn > 0 ? (
              <span className="opc-command-pill opc-command-pill--warn">{warn} watch</span>
            ) : null}
          </div>
        </div>
        <div className="opc-command-hero__gauges">
          <RadialGauge
            pct={progress}
            label="Physical"
            sublabel={money(cur, k.completedValue)}
            size={176}
          />
          <RadialGauge
            pct={elapsed}
            label="Time elapsed"
            tone="steel"
            {...(k.elapsedDays != null && k.plannedDurationDays != null
              ? { sublabel: `${k.elapsedDays} / ${k.plannedDurationDays} days` }
              : {})}
            size={132}
          />
        </div>
      </header>

      <section className="opc-command-kpis" aria-label="Key performance indicators">
        {kpis.map((item, i) => (
          <article
            key={item.id}
            className={`opc-command-kpi opc-command-kpi--${item.tone}`}
            style={{ animationDelay: `${i * 45}ms` }}
          >
            <p className="opc-command-kpi__eyebrow">{item.eyebrow}</p>
            <p className="opc-command-kpi__value">{item.value}</p>
            <p className="opc-command-kpi__meta">{item.meta}</p>
            <div className="opc-command-kpi__bar" aria-hidden>
              <span style={{ width: `${Math.max(3, Math.min(100, item.fill))}%` }} />
            </div>
          </article>
        ))}
      </section>

      <div className="opc-command-grid">
        <section className="opc-command-panel opc-command-panel--chart">
          <div className="opc-command-panel__head">
            <div>
              <p className="opc-command-panel__eyebrow">Cash vs delivery</p>
              <h2 className="opc-command-panel__title">Performance trajectory</h2>
            </div>
            <ul className="opc-command-legend" aria-hidden>
              <li>
                <i className="opc-trend__swatch opc-trend__swatch--paid" /> Paid
              </li>
              <li>
                <i className="opc-trend__swatch opc-trend__swatch--done" /> Completed
              </li>
              <li>
                <i className="opc-trend__swatch opc-trend__swatch--cert" /> Certified
              </li>
            </ul>
          </div>
          {!dash.trends ? (
            <p className="opc-tenders-muted">Trends not available for this role.</p>
          ) : (
            <TrendChart currency={cur} points={dash.trends.points} />
          )}
          <div className="opc-command-signals" aria-label="Trajectory signals">
            {signals.map((s) => (
              <div key={s.id} className="opc-command-signal">
                <p className="opc-command-signal__label">{s.label}</p>
                <p className="opc-command-signal__value">{s.value}</p>
                <p className="opc-command-signal__meta">{s.meta}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="opc-command-panel">
          <div className="opc-command-panel__head">
            <div>
              <p className="opc-command-panel__eyebrow">Commercial stack</p>
              <h2 className="opc-command-panel__title">Value funnel</h2>
            </div>
          </div>
          <CommercialFunnel currency={cur} stages={funnel} />
        </section>

        <section className="opc-command-panel opc-command-panel--health">
          <div className="opc-command-panel__head">
            <div>
              <p className="opc-command-panel__eyebrow">Treasury</p>
              <h2 className="opc-command-panel__title">Liquidity pulse</h2>
            </div>
            <span
              className={`opc-liquidity-badge${k.isLiquidityDeficit ? " is-deficit" : " is-ok"}`}
            >
              {k.isLiquidityDeficit ? "Deficit" : "Healthy"}
            </span>
          </div>
          <div className={`opc-liquidity${k.isLiquidityDeficit ? " is-deficit" : ""}`}>
            <div className="opc-liquidity__hero">
              <div>
                <p className="opc-liquidity__label">
                  {k.isLiquidityDeficit ? "Deficit exposure" : "Net liquidity buffer"}
                </p>
                <p className="opc-liquidity__value">{money(cur, k.netLiquidityBuffer, true)}</p>
                <p className="opc-liquidity__lead">
                  {k.isLiquidityDeficit
                    ? "Cash cover is underwater — prioritize collections."
                    : "Headroom after outstanding cash claims."}
                </p>
              </div>
              <div className="opc-liquidity__meter" aria-hidden>
                <svg viewBox="0 0 120 120" className="opc-liquidity__ring">
                  <circle className="opc-liquidity__ring-track" cx="60" cy="60" r="48" />
                  <circle
                    className="opc-liquidity__ring-arc"
                    cx="60"
                    cy="60"
                    r="48"
                    style={{
                      strokeDasharray: `${ringC}`,
                      strokeDashoffset: `${ringOffset}`
                    }}
                  />
                </svg>
                <div className="opc-liquidity__ring-center">
                  <strong>{paidPct.toFixed(0)}%</strong>
                  <span>Paid</span>
                </div>
              </div>
            </div>

            <div className="opc-liquidity__stack" aria-label="Cash stack composition">
              {cashStack.map((row) => {
                const w = Math.max(4, (row.amount / stackMax) * 100);
                return (
                  <div key={row.id} className={`opc-liquidity__stack-row opc-liquidity__stack-row--${row.tone}`}>
                    <div className="opc-liquidity__stack-meta">
                      <span>{row.label}</span>
                      <strong>{money(cur, String(row.amount), true)}</strong>
                    </div>
                    <div className="opc-liquidity__stack-track">
                      <span style={{ width: `${w}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="opc-command-panel opc-command-panel--attention">
          <div className="opc-command-panel__head">
            <div>
              <p className="opc-command-panel__eyebrow">Live exceptions</p>
              <h2 className="opc-command-panel__title">Attention</h2>
            </div>
            <div className="opc-attention-head">
              <div className="opc-attention-counts" aria-label="Severity counts">
                {danger > 0 ? (
                  <span className="opc-attention-count opc-attention-count--danger">{danger}</span>
                ) : null}
                {warn > 0 ? (
                  <span className="opc-attention-count opc-attention-count--warn">{warn}</span>
                ) : null}
                {dash.attention.countBySeverity.info > 0 ? (
                  <span className="opc-attention-count opc-attention-count--info">
                    {dash.attention.countBySeverity.info}
                  </span>
                ) : null}
              </div>
              <Link className="opc-dash-view-all" href={`/action-centre?projectId=${projectId}`}>
                View all
              </Link>
            </div>
          </div>
          {dash.attention.items.length === 0 ? (
            <div className="opc-command-clear">
              <strong>All clear</strong>
              <p>No attention items. Commercial health looks steady.</p>
            </div>
          ) : (
            <ul className="opc-command-attention">
              {dash.attention.items.map((item) => (
                <li key={item.id} className={`opc-command-attention__item is-${item.severity}`}>
                  <Link href={item.deepLink}>
                    <span className="opc-command-attention__top">
                      <span className={`opc-command-attention__sev is-${item.severity}`}>
                        {item.severity === "danger"
                          ? "Danger"
                          : item.severity === "warning"
                            ? "Warning"
                            : "Info"}
                      </span>
                      <span className="opc-command-attention__cat">
                        {attentionCategoryLabel(item.category)}
                      </span>
                    </span>
                    <strong>{item.title}</strong>
                    <span className="opc-command-attention__body">{item.body}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
