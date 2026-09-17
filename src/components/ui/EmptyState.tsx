import type { ReactNode } from "react";
import { Button } from "./Button";

export interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  children?: ReactNode;
}

export function EmptyState({ title, description, actionLabel, onAction, children }: EmptyStateProps) {
  return (
    <div className="opc-empty">
      <h3 className="opc-empty__title">{title}</h3>
      <p className="opc-empty__desc">{description}</p>
      {actionLabel && onAction ? (
        <Button variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
      {children}
    </div>
  );
}
