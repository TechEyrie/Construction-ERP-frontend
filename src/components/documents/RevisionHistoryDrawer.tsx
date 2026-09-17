"use client";

import { useEffect } from "react";
import type { DocumentRow } from "@/lib/api/services/documentsService";
import { ModalCloseButton } from "@/components/ui/ModalHead";
import { ModalPortal } from "@/components/ui/ModalPortal";

type Props = {
  open: boolean;
  title: string;
  chain: DocumentRow[];
  onClose: () => void;
};

export function RevisionHistoryDrawer({ open, title, chain, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <ModalPortal>
      <div className="opc-docs-drawer-root" role="dialog" aria-modal="true" aria-label="Revision history">
        <button type="button" className="opc-docs-drawer-backdrop" aria-label="Close" onClick={onClose} />
        <aside className="opc-docs-drawer">
          <header className="opc-docs-drawer-head">
            <div>
              <p className="opc-docs-drawer-eyebrow">Revision history</p>
              <h2>{title}</h2>
            </div>
            <ModalCloseButton onClose={onClose} />
          </header>
          <ol className="opc-docs-history">
            {[...chain].reverse().map((d) => (
              <li key={d.id}>
                <span className="opc-docs-rev">{d.revision}</span>
                <div>
                  <strong>{d.fileName}</strong>
                  <p>
                    {new Date(d.uploadedAt).toLocaleString()} · {d.uploadedBy.name}
                    {d.isSuperseded ? " · superseded" : " · current"}
                  </p>
                  {d.notes ? <p className="opc-docs-notes">{d.notes}</p> : null}
                </div>
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </ModalPortal>
  );
}
