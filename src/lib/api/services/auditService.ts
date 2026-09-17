import { apiJsonWithMeta } from "@/lib/api/http";

type Envelope<T> = {
  success: boolean;
  data: T | null;
  meta?: { pagination?: PaginationMeta };
  error: { code: string; message: string } | null;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  totalRecords: number;
  totalPages: number;
};

export type AuditLogRow = {
  id: string;
  actor: { id: string; name: string; role: string };
  entityType: string;
  entityId: string;
  action: string;
  diffSummary: string | null;
  ip: string;
  createdAt: string;
};

async function auditFetch<T>(path: string): Promise<{ data: T; meta?: Envelope<T>["meta"] }> {
  return apiJsonWithMeta<T>(path);
}

export async function listProjectAuditLogs(
  projectId: string,
  opts?: { page?: number; limit?: number }
) {
  const page = opts?.page ?? 1;
  const limit = opts?.limit ?? 20;
  return auditFetch<AuditLogRow[]>(
    `/api/v1/projects/${projectId}/audit-logs?page=${page}&limit=${limit}`
  );
}
