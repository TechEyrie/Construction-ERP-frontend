import { parseFrontendEnv } from "@/config/env";

/**
 * API origin for fetch().
 * Browser calls opc-api directly (NEXT_PUBLIC_API_BASE_URL) so data fetches
 * are not queued behind Next.js dev compilation / RSC soft-nav on :3005.
 * CORS is already allowlisted for the web origin.
 */
export function getApiBaseUrl(): string {
  return parseFrontendEnv().NEXT_PUBLIC_API_BASE_URL.replace(/\/$/, "");
}
