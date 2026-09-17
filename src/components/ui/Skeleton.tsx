import type { CSSProperties, HTMLAttributes } from "react";

type BoneProps = HTMLAttributes<HTMLSpanElement> & {
  width?: string | number;
  height?: string | number;
  radius?: "sm" | "md" | "lg" | "full";
  tone?: "light" | "dark";
};

/** Single shimmer bone. */
export function Skeleton({
  width,
  height = "0.85rem",
  radius = "sm",
  tone = "light",
  className = "",
  style,
  ...rest
}: BoneProps) {
  const merged: CSSProperties = {
    width: typeof width === "number" ? `${width}px` : width,
    height: typeof height === "number" ? `${height}px` : height,
    ...style
  };
  return (
    <span
      className={`opc-skel opc-skel--${radius} opc-skel--${tone}${className ? ` ${className}` : ""}`}
      style={merged}
      aria-hidden
      {...rest}
    />
  );
}

type LoadingMarkProps = {
  label?: string;
  size?: "sm" | "md" | "lg";
};

/** Gold spinning mark + optional label. */
export function LoadingMark({ label, size = "md" }: LoadingMarkProps) {
  return (
    <div className={`opc-load-mark opc-load-mark--${size}`} role="status" aria-live="polite">
      <span className="opc-load-mark__icon" aria-hidden>
        <span className="opc-load-mark__ring" />
        <span className="opc-load-mark__core">◆</span>
      </span>
      {label ? <span className="opc-load-mark__label">{label}</span> : null}
    </div>
  );
}

type PageLoaderProps = {
  label?: string;
};

/** Full-area centered loader (gates, redirects). */
export function PageLoader({ label = "Loading…" }: PageLoaderProps) {
  return (
    <div className="opc-page-loader" aria-busy="true">
      <LoadingMark label={label} size="lg" />
    </div>
  );
}

/** Portfolio card grid body (header already painted). */
export function PortfolioSkeleton() {
  return (
    <div className="opc-skel-cards" aria-busy="true" aria-label="Loading projects">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="opc-skel-card" style={{ animationDelay: `${i * 60}ms` }}>
          <Skeleton width="4.5rem" height="1.1rem" radius="sm" />
          <Skeleton width="70%" height="1.35rem" style={{ marginTop: 14 }} />
          <Skeleton width="90%" height="0.75rem" style={{ marginTop: 10 }} />
          <Skeleton width="55%" height="0.75rem" style={{ marginTop: 8 }} />
          <div className="opc-skel-card__foot">
            <Skeleton width="5rem" height="0.7rem" />
            <Skeleton width="6rem" height="0.7rem" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Command dashboard skeleton. */
export function DashboardSkeleton() {
  return (
    <div className="opc-skel-page opc-skel-page--dash" aria-busy="true" aria-label="Loading dashboard">
      <div className="opc-skel-hero opc-skel-hero--dark">
        <div className="opc-skel-hero__copy">
          <Skeleton tone="dark" width="8rem" height="0.7rem" />
          <Skeleton tone="dark" width="18rem" height="2.2rem" style={{ marginTop: 14 }} />
          <Skeleton tone="dark" width="28rem" height="0.85rem" style={{ marginTop: 12 }} />
          <div className="opc-skel-hero__pills">
            <Skeleton tone="dark" width="5rem" height="1.5rem" radius="sm" />
            <Skeleton tone="dark" width="9rem" height="1.5rem" radius="sm" />
            <Skeleton tone="dark" width="5.5rem" height="1.5rem" radius="sm" />
          </div>
        </div>
        <div className="opc-skel-hero__gauges">
          <Skeleton tone="dark" width={176} height={176} radius="full" />
          <Skeleton tone="dark" width={132} height={132} radius="full" />
        </div>
      </div>
      <div className="opc-skel-kpi-row">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="opc-skel-kpi" style={{ animationDelay: `${i * 40}ms` }}>
            <Skeleton width="55%" height="0.65rem" />
            <Skeleton width="75%" height="1.25rem" style={{ marginTop: 10 }} />
            <Skeleton width="40%" height="0.65rem" style={{ marginTop: 8 }} />
            <Skeleton width="100%" height={3} style={{ marginTop: 14 }} radius="full" />
          </div>
        ))}
      </div>
      <div className="opc-skel-dash-grid">
        <div className="opc-skel-panel opc-skel-panel--dark">
          <Skeleton tone="dark" width="9rem" height="0.7rem" />
          <Skeleton tone="dark" width="14rem" height="1.4rem" style={{ marginTop: 10 }} />
          <Skeleton tone="dark" width="100%" height="16rem" radius="md" style={{ marginTop: 20 }} />
          <div className="opc-skel-signals">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} tone="dark" height="3.5rem" radius="md" />
            ))}
          </div>
        </div>
        <div className="opc-skel-rail">
          <div className="opc-skel-panel">
            <Skeleton width="8rem" height="0.7rem" />
            <Skeleton width="10rem" height="1.3rem" style={{ marginTop: 8 }} />
            <div className="opc-skel-funnel">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} height="2.6rem" radius="md" />
              ))}
            </div>
          </div>
          <div className="opc-skel-panel opc-skel-panel--dark">
            <Skeleton tone="dark" width="6rem" height="0.7rem" />
            <Skeleton tone="dark" width="11rem" height="1.3rem" style={{ marginTop: 8 }} />
            <Skeleton tone="dark" width="100%" height="8rem" radius="md" style={{ marginTop: 16 }} />
          </div>
          <div className="opc-skel-panel">
            <Skeleton width="7rem" height="0.7rem" />
            <Skeleton width="8rem" height="1.3rem" style={{ marginTop: 8 }} />
            <div className="opc-skel-list">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} height="3.2rem" radius="md" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

type ListPageSkeletonProps = {
  titleWidth?: string;
  rows?: number;
  showKpis?: boolean;
};

/** Generic list/table page skeleton. */
export function ListPageSkeleton({ titleWidth = "14rem", rows = 6, showKpis = true }: ListPageSkeletonProps) {
  return (
    <div className="opc-skel-page" aria-busy="true" aria-label="Loading">
      <div className="opc-skel-page__head">
        <div>
          <Skeleton width={titleWidth} height="1.6rem" />
          <Skeleton width="20rem" height="0.8rem" style={{ marginTop: 10 }} />
        </div>
        <Skeleton width="7.5rem" height="2.4rem" radius="md" />
      </div>
      {showKpis ? (
        <div className="opc-skel-kpi-row opc-skel-kpi-row--3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="opc-skel-kpi">
              <Skeleton width="45%" height="0.65rem" />
              <Skeleton width="60%" height="1.2rem" style={{ marginTop: 10 }} />
            </div>
          ))}
        </div>
      ) : null}
      <div className="opc-skel-table">
        <div className="opc-skel-table__head">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} height="0.7rem" width={`${60 + (i % 3) * 10}%`} />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="opc-skel-table__row" style={{ animationDelay: `${i * 50}ms` }}>
            {Array.from({ length: 5 }).map((_, j) => (
              <Skeleton key={j} height="0.85rem" width={`${50 + ((i + j) % 4) * 12}%`} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Detail / form page skeleton. */
export function DetailSkeleton() {
  return (
    <div className="opc-skel-page" aria-busy="true" aria-label="Loading details">
      <Skeleton width="6rem" height="0.85rem" />
      <Skeleton width="16rem" height="1.7rem" style={{ marginTop: 12 }} />
      <Skeleton width="24rem" height="0.8rem" style={{ marginTop: 10 }} />
      <div className="opc-skel-detail-grid">
        <div className="opc-skel-panel">
          <Skeleton width="8rem" height="0.7rem" />
          <div className="opc-skel-list" style={{ marginTop: 16 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="opc-skel-kv">
                <Skeleton width="35%" height="0.7rem" />
                <Skeleton width="50%" height="0.9rem" />
              </div>
            ))}
          </div>
        </div>
        <div className="opc-skel-panel">
          <Skeleton width="7rem" height="0.7rem" />
          <Skeleton width="100%" height="12rem" radius="md" style={{ marginTop: 16 }} />
        </div>
      </div>
    </div>
  );
}

type TableSkeletonProps = {
  rows?: number;
  cols?: number;
};

/** Inline table body skeleton (page chrome already visible). */
export function TableSkeleton({ rows = 6, cols = 5 }: TableSkeletonProps) {
  return (
    <div className="opc-skel-table" aria-busy="true" aria-label="Loading">
      <div className="opc-skel-table__head">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} height="0.7rem" width={`${60 + (i % 3) * 10}%`} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="opc-skel-table__row" style={{ animationDelay: `${i * 50}ms` }}>
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} height="0.85rem" width={`${50 + ((i + j) % 4) * 12}%`} />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Action centre / notification list skeleton. */
export function ActionListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <ul className="opc-skel-action-list" aria-busy="true" aria-label="Loading notifications">
      {Array.from({ length: rows }).map((_, i) => (
        <li key={i} className="opc-skel-action-row" style={{ animationDelay: `${i * 60}ms` }}>
          <Skeleton width={10} height={10} radius="full" />
          <div className="opc-skel-action-copy">
            <Skeleton width="55%" height="0.95rem" />
            <Skeleton width="88%" height="0.75rem" style={{ marginTop: 8 }} />
            <Skeleton width="30%" height="0.65rem" style={{ marginTop: 10 }} />
          </div>
          <Skeleton width="4rem" height="0.7rem" />
        </li>
      ))}
    </ul>
  );
}
