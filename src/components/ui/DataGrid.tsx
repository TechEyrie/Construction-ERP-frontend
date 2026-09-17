export interface DataGridColumn {
  key: string;
  header: string;
  align?: "left" | "right";
  /** Shown in mobile card meta grid */
  mobileLabel?: string;
}

export interface DataGridRow {
  id: string;
  cells: Record<string, string>;
  /** Primary card title on mobile */
  title?: string;
  subtitle?: string;
}

export interface DataGridProps {
  columns: DataGridColumn[];
  rows: DataGridRow[];
  /** Keys rendered in mobile 2-col key-value grid (default: numeric cols) */
  mobileKeys?: string[];
}

export function DataGrid({ columns, rows, mobileKeys }: DataGridProps) {
  const kvKeys =
    mobileKeys ??
    columns.filter((c) => c.align === "right").map((c) => c.key);

  return (
    <div className="opc-grid-wrap">
      <div className="opc-grid-desktop">
        <table className="opc-grid">
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key} className={c.align === "right" ? "opc-num" : undefined}>
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                {columns.map((c) => (
                  <td key={c.key} className={c.align === "right" ? "opc-num" : undefined}>
                    {r.cells[c.key] ?? ""}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="opc-grid-cards" aria-label="Mobile card view">
        {rows.map((r) => (
          <article key={r.id} className="opc-grid-card">
            <p className="opc-grid-card__code">{r.title ?? r.cells[columns[0]?.key ?? ""] ?? r.id}</p>
            {r.subtitle || columns[1] ? (
              <p className="opc-grid-card__desc">{r.subtitle ?? r.cells[columns[1]?.key ?? ""] ?? ""}</p>
            ) : null}
            <dl className="opc-grid-card__kv">
              {kvKeys.map((key) => {
                const col = columns.find((c) => c.key === key);
                return (
                  <div key={key}>
                    <dt>{col?.mobileLabel ?? col?.header ?? key}</dt>
                    <dd>{r.cells[key] ?? ""}</dd>
                  </div>
                );
              })}
            </dl>
          </article>
        ))}
      </div>
    </div>
  );
}
