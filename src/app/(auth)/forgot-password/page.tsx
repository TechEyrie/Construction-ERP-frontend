"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { forgotPassword } from "@/lib/auth/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await forgotPassword(email);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="opc-auth opc-auth-solo">
      <form className="opc-auth-card" onSubmit={(e) => void onSubmit(e)}>
        <p className="opc-auth-eyebrow">AUTHENTICATION</p>
        <h2>Forgot password</h2>
        <p className="opc-auth-hint">
          If an account exists, a reset token is logged for admin relay (no email in Phase 01).
        </p>
        {error ? (
          <div className="opc-auth-error" role="alert">
            {error}
          </div>
        ) : null}
        {done ? (
          <p className="opc-auth-hint">Request accepted. Contact your administrator for the reset token.</p>
        ) : (
          <label className="opc-auth-label">
            Work Email
            <input
              className="opc-auth-input"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={busy}
            />
          </label>
        )}
        {!done ? (
          <button type="submit" className="opc-auth-submit" disabled={busy}>
            {busy ? "Submitting…" : "Send reset request"}
          </button>
        ) : null}
        <Link className="opc-auth-forgot" href="/login">
          Back to sign in
        </Link>
      </form>
    </main>
  );
}
