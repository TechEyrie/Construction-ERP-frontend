import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "gold";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  loading?: boolean;
  blockOnMobile?: boolean;
  children: ReactNode;
}

export function Button({
  variant = "primary",
  loading = false,
  blockOnMobile = false,
  className = "",
  disabled,
  children,
  type = "button",
  ...rest
}: ButtonProps) {
  const classes = [
    "opc-btn",
    `opc-btn--${variant}`,
    loading ? "opc-btn--loading" : "",
    blockOnMobile ? "opc-btn--block-sm" : "",
    className
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button type={type} className={classes} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {loading ? <span className="opc-btn__spinner" aria-hidden /> : null}
      {children}
    </button>
  );
}
