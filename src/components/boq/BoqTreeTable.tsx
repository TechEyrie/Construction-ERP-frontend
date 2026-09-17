"use client";

import Link from "next/link";
import { useState } from "react";
import { patchBoqItem, type BoqTreeNode } from "@/lib/api/services/boqService";

type Props = {
  projectId: string;
  nodes: BoqTreeNode[];
  locked: boolean;
  canEdit: boolean;
  onChanged: () => void;
};

function money(qar: string): string {
  const n = Number(qar);
  return Number.isFinite(n)
    ? n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : qar;
}

function Row({
  projectId,
  node,
  depth,
  locked,
  canEdit,
  onChanged
}: {
  projectId: string;
  node: BoqTreeNode;
  depth: number;
  locked: boolean;
  canEdit: boolean;
  onChanged: () => void;
}) {
  const [open, setOpen] = useState(depth < 2);
  const [editing, setEditing] = useState(false);
  const [qty, setQty] = useState(node.contractQty);
  const [rate, setRate] = useState(node.unitRate);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const hasKids = Boolean(node.children?.length);

  async function save() {
    setBusy(true);
    setErr(null);
    try {
      await patchBoqItem(projectId, node.id, { contractQty: qty, unitRate: rate });
      setEditing(false);
      onChanged();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <tr>
        <td style={{ paddingLeft: `${depth * 16 + 8}px` }}>
          {hasKids ? (
            <button type="button" className="opc-boq-toggle" onClick={() => setOpen((v) => !v)}>
              {open ? "▾" : "▸"}
            </button>
          ) : (
            <span className="opc-boq-toggle-spacer" />
          )}
          <Link href={`/projects/${projectId}/boq/items/${node.id}`} className="opc-boq-item-link">
            <code>{node.itemCode}</code>
          </Link>
        </td>
        <td>{node.description}</td>
        <td>{node.unit}</td>
        <td className="opc-boq-num">
          {editing ? (
            <input value={qty} onChange={(e) => setQty(e.target.value)} disabled={busy} />
          ) : hasKids ? (
            "—"
          ) : (
            money(node.contractQty)
          )}
        </td>
        <td className="opc-boq-num">
          {editing ? (
            <input value={rate} onChange={(e) => setRate(e.target.value)} disabled={busy} />
          ) : hasKids ? (
            "—"
          ) : (
            money(node.unitRate)
          )}
        </td>
        <td className="opc-boq-num">{money(node.boqAmount)}</td>
        <td>
          {!locked && canEdit && !hasKids ? (
            editing ? (
              <button type="button" className="opc-btn opc-btn--primary" disabled={busy} onClick={() => void save()}>
                Save
              </button>
            ) : (
              <button type="button" className="opc-btn opc-btn--secondary" onClick={() => setEditing(true)}>
                Edit
              </button>
            )
          ) : null}
          {err ? <span className="opc-tenders-error">{err}</span> : null}
        </td>
      </tr>
      {open && hasKids
        ? node.children!.map((c) => (
            <Row
              key={c.id}
              projectId={projectId}
              node={c}
              depth={depth + 1}
              locked={locked}
              canEdit={canEdit}
              onChanged={onChanged}
            />
          ))
        : null}
    </>
  );
}

export function BoqTreeTable({ projectId, nodes, locked, canEdit, onChanged }: Props) {
  if (!nodes.length) return <p className="opc-tenders-muted">No WBS items yet — import or add drafts.</p>;
  return (
    <table className="opc-boq-table opc-boq-tree">
      <thead>
        <tr>
          <th>Code</th>
          <th>Description</th>
          <th>Unit</th>
          <th>Qty</th>
          <th>Rate</th>
          <th>Amount</th>
          <th />
        </tr>
      </thead>
      <tbody>
        {nodes.map((n) => (
          <Row
            key={n.id}
            projectId={projectId}
            node={n}
            depth={0}
            locked={locked}
            canEdit={canEdit}
            onChanged={onChanged}
          />
        ))}
      </tbody>
    </table>
  );
}
