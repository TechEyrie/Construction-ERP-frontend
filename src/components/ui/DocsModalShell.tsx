"use client";

import {
  useEffect,
  type FormEventHandler,
  type MouseEvent,
  type ReactNode
} from "react";
import { ModalHead } from "./ModalHead";
import { ModalPortal } from "./ModalPortal";

type DocsModalShellProps = {
  onClose: () => void;
  children: ReactNode;
  title: string;
  titleId?: string;
  ariaLabel?: string;
  asForm?: boolean;
  onSubmit?: FormEventHandler<HTMLFormElement>;
};

/**
 * Scrollable centered dialog with close button, backdrop dismiss, and Escape.
 * Put form fields as children; footer actions should use opc-docs-modal-actions.
 */
export function DocsModalShell({
  onClose,
  children,
  title,
  titleId,
  ariaLabel,
  asForm,
  onSubmit
}: DocsModalShellProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const stop = (e: MouseEvent) => e.stopPropagation();
  const labelledBy = titleId ?? undefined;

  const body = (
    <>
      <ModalHead
        title={title}
        {...(titleId ? { titleId } : {})}
        onClose={onClose}
      />
      {children}
    </>
  );

  return (
    <ModalPortal>
      <div className="opc-docs-modal" role="presentation" data-opc-modal="docs-v2" onClick={onClose}>
        {asForm ? (
          <form
            className="opc-docs-modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby={labelledBy}
            aria-label={ariaLabel}
            onClick={stop}
            onSubmit={onSubmit}
          >
            {body}
          </form>
        ) : (
          <div
            className="opc-docs-modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby={labelledBy}
            aria-label={ariaLabel}
            onClick={stop}
          >
            {body}
          </div>
        )}
      </div>
    </ModalPortal>
  );
}
