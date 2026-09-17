"use client";

import "@/styles/tokens.css";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const ts = new Date().toISOString();
  return (
    <html lang="en">
      <body className="opc-global-error-body">
        <div className="opc-global-error-card">
          <p className="opc-global-error-badge">Bootstrap failure</p>
          <h1 className="opc-global-error-title">Something went wrong</h1>
          <p className="opc-global-error-desc">
            The app could not finish loading. Retry, or check that the API base URL is reachable.
          </p>
          <p className="opc-global-error-meta">
            {error.digest ? `Correlation: ${error.digest} · ` : null}
            {ts}
          </p>
          <button type="button" className="opc-global-error-cta" onClick={reset}>
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
