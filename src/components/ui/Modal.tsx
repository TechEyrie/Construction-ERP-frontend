"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Button } from "./Button";
import { ModalHead } from "./ModalHead";
import { ModalPortal } from "./ModalPortal";

export interface ModalProps {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  primaryLabel?: string;
  onPrimary?: () => void;
}

export function Modal({ open, title, children, onClose, primaryLabel, onPrimary }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    panelRef.current?.querySelector<HTMLElement>("button, [href], input")?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <ModalPortal>
      <div className="opc-overlay" role="presentation" onClick={onClose}>
        <div
          ref={panelRef}
          className="opc-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="opc-modal-title"
          onClick={(e) => e.stopPropagation()}
        >
          <ModalHead title={title} titleId="opc-modal-title" onClose={onClose} />
          <div className="opc-modal__body">{children}</div>
          <div className="opc-modal__actions">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            {primaryLabel && onPrimary ? (
              <Button variant="primary" onClick={onPrimary}>
                {primaryLabel}
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
