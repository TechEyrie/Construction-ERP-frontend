"use client";

import { useEffect, useId, useMemo, useRef, useState, type PointerEvent } from "react";

export type TrendPoint = {
  month: string;
  paid: string;
  completedValue: string;
  certifiedValue: string | null;
};

type Props = {
  currency: string;
  points: TrendPoint[];
};

function n(v: string | null | undefined): number {
  const x = Number(v ?? 0);
  return Number.isFinite(x) ? x : 0;
}

function fmt(currency: string, amount: number): string {
  return `${currency} ${amount.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })}`;
}

function fmtCompact(amount: number): string {
  const abs = Math.abs(amount);
  if (abs >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${(amount / 1_000).toFixed(0)}k`;
  return amount.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function monthLabel(ym: string): string {
  const [y, m] = ym.split("-");
  const d = new Date(Date.UTC(Number(y), Number(m) - 1, 1));
  return d.toLocaleString("en-US", { month: "short", year: "2-digit", timeZone: "UTC" });
}

const W = 720;
const PAD = { t: 24, r: 18, b: 36, l: 52 };
const MIN_H = 280;

export function TrendChart({ currency, points }: Props) {
  const gid = useId().replace(/:/g, "");
  const canvasRef = useRef<HTMLDivElement>(null);
  const [plotH, setPlotH] = useState(MIN_H);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const apply = () => {
      const h = Math.floor(el.clientHeight);
      if (!Number.isFinite(h) || h < 80) return;
      setPlotH(Math.min(520, Math.max(MIN_H, h)));
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const series = useMemo(() => {
    const rows = points.map((p) => ({
      month: p.month,
      label: monthLabel(p.month),
      paid: n(p.paid),
      done: n(p.completedValue),
      cert: n(p.certifiedValue)
    }));
    const max = Math.max(1, ...rows.flatMap((r) => [r.paid, r.done, r.cert]));
    const innerW = W - PAD.l - PAD.r;
    const innerH = plotH - PAD.t - PAD.b;
    const xAt = (i: number) =>
      PAD.l + (rows.length <= 1 ? innerW / 2 : (i / (rows.length - 1)) * innerW);
    const yAt = (v: number) => PAD.t + innerH - (v / max) * innerH;
    const slot = rows.length > 0 ? innerW / rows.length : innerW;
    const barW = Math.max(8, Math.min(28, slot * 0.42));
    const line = (key: "paid" | "done" | "cert") =>
      rows
        .map((r, i) => `${i === 0 ? "M" : "L"} ${xAt(i).toFixed(1)} ${yAt(r[key]).toFixed(1)}`)
        .join(" ");
    const area = (key: "paid" | "done" | "cert") => {
      if (!rows.length) return "";
      const base = PAD.t + innerH;
      return `${line(key)} L ${xAt(rows.length - 1).toFixed(1)} ${base} L ${xAt(0).toFixed(1)} ${base} Z`;
    };
    const grid = [0, 0.25, 0.5, 0.75, 1].map((t) => ({
      y: PAD.t + innerH * (1 - t),
      label: fmtCompact(max * t)
    }));
    return { rows, max, xAt, yAt, line, area, grid, innerH, innerW, barW };
  }, [points, plotH]);

  if (!series.rows.length) {
    return <p className="opc-tenders-muted">No trend points yet.</p>;
  }

  const active = hover != null ? series.rows[hover] : null;
  const tipX = hover != null ? series.xAt(hover) : 0;
  const tipPct = tipX / W;

  function nearestIndex(clientX: number, svg: SVGSVGElement): number {
    const rect = svg.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * W;
    let best = 0;
    let bestDist = Infinity;
    for (let i = 0; i < series.rows.length; i++) {
      const d = Math.abs(series.xAt(i) - x);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    }
    return best;
  }

  function onPointerMove(e: PointerEvent<SVGSVGElement>) {
    setHover(nearestIndex(e.clientX, e.currentTarget));
  }

  return (
    <div className="opc-trend">
      <div className="opc-trend__canvas" ref={canvasRef}>
        <svg
          className="opc-trend__svg"
          viewBox={`0 0 ${W} ${plotH}`}
          preserveAspectRatio="none"
          role="img"
          aria-label="Monthly paid, completed, and certified values"
          onPointerMove={onPointerMove}
          onPointerLeave={() => setHover(null)}
        >
          <defs>
            <linearGradient id={`g-done-${gid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-quaternary)" stopOpacity="0.38" />
              <stop offset="100%" stopColor="var(--chart-quaternary)" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id={`g-paid-${gid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-primary)" stopOpacity="0.42" />
              <stop offset="100%" stopColor="var(--chart-primary)" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id={`g-bar-${gid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-tertiary)" stopOpacity="0.55" />
              <stop offset="100%" stopColor="var(--chart-tertiary)" stopOpacity="0.12" />
            </linearGradient>
            <filter id={`glow-${gid}`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {series.grid.map((g) => (
            <g key={g.y}>
              <line
                className="opc-trend__grid"
                x1={PAD.l}
                x2={W - PAD.r}
                y1={g.y}
                y2={g.y}
              />
              <text className="opc-trend__axis" x={PAD.l - 8} y={g.y + 3} textAnchor="end">
                {g.label}
              </text>
            </g>
          ))}

          {series.rows.map((r, i) => {
            const h = Math.max(0, PAD.t + series.innerH - series.yAt(r.cert));
            if (h <= 0) return null;
            return (
              <rect
                key={`bar-${r.month}`}
                className={`opc-trend__bar${hover === i ? " is-active" : ""}`}
                x={series.xAt(i) - series.barW / 2}
                y={series.yAt(r.cert)}
                width={series.barW}
                height={h}
                rx={3}
                fill={`url(#g-bar-${gid})`}
              />
            );
          })}

          <path className="opc-trend__area opc-trend__area--done" d={series.area("done")} fill={`url(#g-done-${gid})`} />
          <path className="opc-trend__area opc-trend__area--paid" d={series.area("paid")} fill={`url(#g-paid-${gid})`} />

          <path
            className="opc-trend__line opc-trend__line--done"
            d={series.line("done")}
            filter={`url(#glow-${gid})`}
          />
          <path className="opc-trend__line opc-trend__line--cert" d={series.line("cert")} />
          <path
            className="opc-trend__line opc-trend__line--paid"
            d={series.line("paid")}
            filter={`url(#glow-${gid})`}
          />

          {series.rows.map((r, i) => (
            <g key={r.month}>
              <text
                className="opc-trend__axis opc-trend__axis--x"
                x={series.xAt(i)}
                y={plotH - 12}
                textAnchor="middle"
              >
                {r.label}
              </text>
              <circle
                className="opc-trend__dot opc-trend__dot--paid opc-trend__dot--idle"
                cx={series.xAt(i)}
                cy={series.yAt(r.paid)}
                r="3.5"
              />
            </g>
          ))}

          <rect
            className="opc-trend__hit"
            x={PAD.l}
            y={PAD.t}
            width={series.innerW}
            height={series.innerH}
          />

          {hover != null && active ? (
            <g className="opc-trend__focus" style={{ pointerEvents: "none" }}>
              <line
                className="opc-trend__cross"
                x1={tipX}
                x2={tipX}
                y1={PAD.t}
                y2={PAD.t + series.innerH}
              />
              <circle className="opc-trend__dot opc-trend__dot--done" cx={tipX} cy={series.yAt(active.done)} r="5" />
              <circle className="opc-trend__dot opc-trend__dot--cert" cx={tipX} cy={series.yAt(active.cert)} r="4.5" />
              <circle className="opc-trend__dot opc-trend__dot--paid" cx={tipX} cy={series.yAt(active.paid)} r="5.5" />
            </g>
          ) : null}
        </svg>

        {active ? (
          <div
            className="opc-trend__tip"
            style={{
              left: `${Math.min(90, Math.max(10, tipPct * 100))}%`
            }}
          >
            <p className="opc-trend__tip-month">{active.label}</p>
            <dl>
              <div>
                <dt>
                  <i className="opc-trend__swatch opc-trend__swatch--paid" /> Paid
                </dt>
                <dd>{fmt(currency, active.paid)}</dd>
              </div>
              <div>
                <dt>
                  <i className="opc-trend__swatch opc-trend__swatch--done" /> Completed
                </dt>
                <dd>{fmt(currency, active.done)}</dd>
              </div>
              <div>
                <dt>
                  <i className="opc-trend__swatch opc-trend__swatch--cert" /> Certified
                </dt>
                <dd>{fmt(currency, active.cert)}</dd>
              </div>
            </dl>
          </div>
        ) : (
          <p className="opc-trend__hint">Hover months for paid · completed · certified</p>
        )}
      </div>
    </div>
  );
}
