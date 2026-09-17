"use client";

type ModalCloseButtonProps = {
  onClose: () => void;
};

/** Shared dismiss control for dialogs / sheets. */
export function ModalCloseButton({ onClose }: ModalCloseButtonProps) {
  return (
    <button type="button" className="opc-modal-close" aria-label="Close" onClick={onClose}>
      <span aria-hidden="true">×</span>
    </button>
  );
}

type ModalHeadProps = {
  title: string;
  titleId?: string;
  onClose: () => void;
  eyebrow?: string;
};

export function ModalHead({ title, titleId, onClose, eyebrow }: ModalHeadProps) {
  return (
    <div className="opc-modal-head">
      <div className="opc-modal-head__text">
        {eyebrow ? <p className="opc-modal-head__eyebrow">{eyebrow}</p> : null}
        <h2 id={titleId} className="opc-modal-head__title">
          {title}
        </h2>
      </div>
      <ModalCloseButton onClose={onClose} />
    </div>
  );
}
