"use client";

import { useState } from "react";

type Stage = {
  id: string;
  label: string;
  amount: number;
  tone: "contract" | "cert" | "invoice" | "paid" | "funding";
};

type Props = {
  currency: string;
  stages: Stage[];
};

function fmt(currency: string, amount: number): string {
  return `${currency} ${amount.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })}`;
}

export function CommercialFunnel({ currency, stages }: Props) {
  const [active, setActive] = useState<string | null>(null);
  const max = Math.max(1, ...stages.map((s) => s.amount));

  return (
    <div className="opc-funnel">
      {stages.map((s) => {
        const pct = (s.amount / max) * 100;
        const isOn = active === s.id;
        return (
          <button
            key={s.id}
            type="button"
            className={`opc-funnel__row opc-funnel__row--${s.tone}${isOn ? " is-active" : ""}`}
            onMouseEnter={() => setActive(s.id)}
            onMouseLeave={() => setActive(null)}
            onFocus={() => setActive(s.id)}
            onBlur={() => setActive(null)}
          >
            <div className="opc-funnel__meta">
              <span className="opc-funnel__label">{s.label}</span>
              <span className="opc-funnel__amt">{fmt(currency, s.amount)}</span>
            </div>
            <div className="opc-funnel__track" aria-hidden>
              <span className="opc-funnel__fill" style={{ width: `${Math.max(2, pct)}%` }} />
            </div>
            {isOn ? (
              <span className="opc-funnel__tip">
                {pct.toFixed(1)}% of contract envelope · {fmt(currency, s.amount)}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
