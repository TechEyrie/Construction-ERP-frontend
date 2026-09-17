"use client";

import { useEffect, type ReactNode } from "react";
import { Button } from "./Button";
import { ModalHead } from "./ModalHead";
import { ModalPortal } from "./ModalPortal";

export interface SheetProps {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
}

export function Sheet({ open, title, children, onClose }: SheetProps) {
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
      <div className="opc-sheet-overlay" role="presentation" onClick={onClose}>
        <div
          className="opc-sheet"
          role="dialog"
          aria-modal="true"
          aria-label={title}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="opc-sheet__handle" aria-hidden />
          <ModalHead title={title} onClose={onClose} />
          <div className="opc-modal__body">{children}</div>
          <Button variant="secondary" blockOnMobile onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </ModalPortal>
  );
}
