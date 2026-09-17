"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { login } from "@/lib/auth/api";
import { getAccessToken, isAccessTokenExpired } from "@/lib/auth/session";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    if (token && !isAccessTokenExpired()) {
      router.replace("/projects");
    }
  }, [router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(email, password);
      router.replace("/projects");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="opc-auth">
      <section className="opc-auth-hero" aria-hidden="true">
        <div className="opc-auth-hero-inner">
          <h1>Owner Project Control</h1>
          <p>Authoritative project control and commercial governance for capital asset owners.</p>
        </div>
      </section>
      <section className="opc-auth-panel">
        <form className="opc-auth-card" onSubmit={(e) => void onSubmit(e)}>
          <p className="opc-auth-eyebrow">AUTHENTICATION</p>
          <h2>Sign in to workspace</h2>
          {error ? (
            <div className="opc-auth-error" role="alert">
              {error}
            </div>
          ) : null}
          <label className="opc-auth-label">
            Work Email
            <input
              className="opc-auth-input"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={busy}
            />
          </label>
          <label className="opc-auth-label">
            Password
            <span className="opc-auth-pw-wrap">
              <input
                className="opc-auth-input"
                type={showPw ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={busy}
              />
              <button type="button" className="opc-auth-reveal" onClick={() => setShowPw((v) => !v)}>
                {showPw ? "Hide" : "Show"}
              </button>
            </span>
          </label>
          <Link className="opc-auth-forgot" href="/forgot-password">
            Forgot Password
          </Link>
          <button type="submit" className="opc-auth-submit" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </section>
    </main>
  );
}
