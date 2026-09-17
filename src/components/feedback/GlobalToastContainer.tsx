"use client";

import { useEffect, useState } from "react";

export type ToastKind = "warning" | "danger";

export type ToastItem = {
  id: string;
  title: string;
  message: string;
  kind: ToastKind;
  requestId?: string;
  persistent?: boolean;
};

type Listener = (items: ToastItem[]) => void;

let items: ToastItem[] = [];
const listeners = new Set<Listener>();

function emit() {
  for (const l of listeners) l(items);
}

export function pushToast(input: Omit<ToastItem, "id"> & { id?: string }): string {
  const id = input.id ?? crypto.randomUUID();
  const toast: ToastItem = { ...input, id };
  items = [...items, toast];
  emit();
  if (!toast.persistent) {
    window.setTimeout(() => dismissToast(id), 5000);
  }
  return id;
}

export function dismissToast(id: string): void {
  items = items.filter((t) => t.id !== id);
  emit();
}

export function subscribeToasts(listener: Listener): () => void {
  listeners.add(listener);
  listener(items);
  return () => {
    listeners.delete(listener);
  };
}

/** Raise toast from API envelope failures. */
export function toastFromApiError(payload: {
  message: string;
  code?: string;
  requestId?: string;
  status?: number;
}): void {
  const kind: ToastKind = payload.status && payload.status >= 500 ? "danger" : "warning";
  const toast: Omit<ToastItem, "id"> = {
    title: payload.code ?? "Request failed",
    message: payload.message,
    kind,
    persistent: kind === "danger"
  };
  if (payload.requestId) toast.requestId = payload.requestId;
  pushToast(toast);
}

export function GlobalToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => subscribeToasts(setToasts), []);

  if (toasts.length === 0) return null;

  return (
    <div className="opc-toast-stack" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`opc-toast opc-toast-${t.kind}`} role="status">
          <div className="opc-toast-body">
            <p className="opc-toast-title">{t.title}</p>
            <p className="opc-toast-msg">{t.message}</p>
            {t.requestId ? <p className="opc-toast-ref">Ref: {t.requestId}</p> : null}
          </div>
          <button type="button" className="opc-toast-dismiss" aria-label="Dismiss" onClick={() => dismissToast(t.id)}>
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
