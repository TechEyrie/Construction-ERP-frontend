"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { resetPassword } from "@/lib/auth/api";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await resetPassword(token, password);
      router.push("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="opc-auth opc-auth-solo">
      <form className="opc-auth-card" onSubmit={(e) => void onSubmit(e)}>
        <p className="opc-auth-eyebrow">AUTHENTICATION</p>
        <h2>Reset password</h2>
        {error ? (
          <div className="opc-auth-error" role="alert">
            {error}
          </div>
        ) : null}
        <label className="opc-auth-label">
          Reset token
          <input
            className="opc-auth-input"
            required
            pattern="[0-9a-fA-F]{64}"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            disabled={busy}
          />
        </label>
        <label className="opc-auth-label">
          New password
          <input
            className="opc-auth-input"
            type="password"
            required
            minLength={12}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={busy}
          />
        </label>
        <button type="submit" className="opc-auth-submit" disabled={busy}>
          {busy ? "Saving…" : "Update password"}
        </button>
        <Link className="opc-auth-forgot" href="/login">
          Back to sign in
        </Link>
      </form>
    </main>
  );
}
