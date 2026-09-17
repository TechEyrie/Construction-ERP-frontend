"use client";

import type { Connectivity } from "@/lib/shell/shellState";

export function OfflineBanner({ connectivity }: { connectivity: Connectivity }) {
  if (connectivity === "online") return null;

  const message =
    connectivity === "offline"
      ? "You are offline. You can browse cached screens; saving changes requires a connection."
      : "Can't reach the API server. Confirm opc-api is running (default http://127.0.0.1:4000).";

  return (
    <div
      className={`opc-offline${connectivity === "api-unreachable" ? " opc-offline--api" : ""}`}
      role="alert"
      aria-live="polite"
    >
      {message}
    </div>
  );
}
