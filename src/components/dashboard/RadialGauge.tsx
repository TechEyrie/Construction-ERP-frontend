"use client";

type Props = {
  pct: number;
  label: string;
  sublabel?: string;
  size?: number;
  tone?: "gold" | "steel";
};

/** Animated radial progress for command hero. */
export function RadialGauge({ pct, label, sublabel, size = 168, tone = "gold" }: Props) {
  const clamped = Math.max(0, Math.min(100, pct));
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (clamped / 100) * c;
  const ticks = Array.from({ length: 24 }, (_, i) => {
    const a = (i / 24) * Math.PI * 2 - Math.PI / 2;
    const outer = r + stroke / 2 - 1;
    const inner = outer - (i % 6 === 0 ? 8 : 4);
    return {
      x1: size / 2 + Math.cos(a) * inner,
      y1: size / 2 + Math.sin(a) * inner,
      x2: size / 2 + Math.cos(a) * outer,
      y2: size / 2 + Math.sin(a) * outer
    };
  });

  return (
    <div className={`opc-gauge opc-gauge--${tone}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle
          className="opc-gauge__track"
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          fill="none"
        />
        {ticks.map((t, i) => (
          <line
            key={i}
            className="opc-gauge__tick"
            x1={t.x1}
            y1={t.y1}
            x2={t.x2}
            y2={t.y2}
          />
        ))}
        <circle
          className="opc-gauge__arc"
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="opc-gauge__center">
        <strong className="opc-gauge__value">{clamped.toFixed(1)}%</strong>
        <span className="opc-gauge__label">{label}</span>
        {sublabel ? <span className="opc-gauge__sub">{sublabel}</span> : null}
      </div>
    </div>
  );
}
