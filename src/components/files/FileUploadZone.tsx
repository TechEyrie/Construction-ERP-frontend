"use client";

import { useCallback, useRef, useState, type DragEvent, type ChangeEvent } from "react";

type Props = {
  disabled?: boolean;
  accept?: string;
  hint?: string;
  onFile: (file: File) => void | Promise<void>;
};

/** AC-08: idle slate / drag-over gold. */
export function FileUploadZone({
  disabled,
  accept = ".pdf,.png,.jpg,.jpeg",
  hint = "PDF, PNG, or JPEG · max 25 MB",
  onFile
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handle = useCallback(
    async (file: File | undefined) => {
      if (!file || disabled) return;
      setBusy(true);
      setError(null);
      try {
        await onFile(file);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Upload failed");
      } finally {
        setBusy(false);
      }
    },
    [disabled, onFile]
  );

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    void handle(e.dataTransfer.files?.[0]);
  }

  function onDragOver(e: DragEvent) {
    e.preventDefault();
    setDragging(true);
  }

  function onChange(e: ChangeEvent<HTMLInputElement>) {
    void handle(e.target.files?.[0]);
    e.target.value = "";
  }

  return (
    <div className="opc-upload">
      <button
        type="button"
        className={`opc-upload-zone${dragging ? " opc-upload-zone-active" : ""}`}
        aria-disabled={disabled || busy || undefined}
        onClick={() => {
          if (disabled || busy) return;
          inputRef.current?.click();
        }}
        onDragOver={(e) => {
          if (disabled || busy) return;
          onDragOver(e);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          if (disabled || busy) return;
          onDrop(e);
        }}
      >
        <span className="opc-upload-title">{busy ? "Uploading…" : "Drop file here or browse"}</span>
        <span className="opc-upload-hint">{hint}</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        className="opc-upload-input"
        accept={accept}
        disabled={disabled || busy}
        onChange={onChange}
      />
      {error ? <p className="opc-upload-error">{error}</p> : null}
    </div>
  );
}
