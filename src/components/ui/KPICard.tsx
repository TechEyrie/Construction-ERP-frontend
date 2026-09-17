export interface KPICardProps {
  eyebrow: string;
  value: string;
  unitOrCurrency?: string;
  trendText?: string;
  trendDirection?: "up" | "down" | "neutral";
  accentColor?: "gold" | "ink" | "emerald";
  lastUpdated?: string;
  isLoading?: boolean;
}

export function KPICard({
  eyebrow,
  value,
  unitOrCurrency,
  trendText,
  trendDirection = "neutral",
  accentColor = "ink",
  lastUpdated,
  isLoading
}: KPICardProps) {
  const accent = accentColor === "ink" ? "" : `opc-kpi--${accentColor}`;
  return (
    <article className={`opc-kpi ${accent}`.trim()} aria-busy={isLoading || undefined}>
      <p className="opc-kpi__eyebrow">{eyebrow}</p>
      {isLoading ? (
        <div className="opc-kpi__skeleton" />
      ) : (
        <p className="opc-kpi__value opc-tabular">
          {unitOrCurrency ? `${unitOrCurrency} ` : ""}
          {value}
        </p>
      )}
      {trendText ? (
        <p className={`opc-kpi__meta opc-kpi__trend--${trendDirection}`}>{trendText}</p>
      ) : null}
      {lastUpdated ? <p className="opc-kpi__meta">{lastUpdated}</p> : null}
    </article>
  );
}
