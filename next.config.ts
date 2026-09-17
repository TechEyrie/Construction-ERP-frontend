import type { NextConfig } from "next";
import { parseFrontendEnv } from "./src/config/env";

parseFrontendEnv(process.env);

/** Upstream opc-api for Next rewrites (browser calls same-origin /api + /healthz). */
const API_ORIGIN = (process.env.OPC_API_ORIGIN ?? "http://127.0.0.1:4000").replace(/\/$/, "");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Dev: allow both localhost and 127.0.0.1 hosts without warnings
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  async rewrites() {
    return [
      { source: "/healthz", destination: `${API_ORIGIN}/healthz` },
      { source: "/api/:path*", destination: `${API_ORIGIN}/api/:path*` }
    ];
  }
};

export default nextConfig;
