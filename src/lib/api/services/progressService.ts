import { apiJsonWithMeta } from "@/lib/api/http";

type Envelope<T> = {
  success: boolean;
  data: T | null;
  error: { code: string; message: string } | null;
  meta?: { total?: number; page?: number; limit?: number; totalPages?: number };
};

export type ProgressUpdate = {
  id: string;
  projectId: string;
  boqItemId: string;
  itemCode: string;
  itemDescription: string;
  unit: string;
  completedQty: string;
  completionPct: number;
  incrementalQty: string;
  completedValue: string;
  progressDate: string | null;
  comment: string;
  evidenceDocumentIds: string[];
  revisionOf: string | null;
  status: string;
  isOverCompletion: boolean;
  adminOverrideReason: string | null;
  submittedBy: string | null;
  submittedAt: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewComment: string | null;
};

export type ProgressSummary = {
  projectId: string;
  progressMethod: string;
  totalBaselineBoqValue: string;
  totalCompletedValue: string;
  overallPhysicalProgressPct: number;
  totalApprovedUpdates: number;
  pendingReviewCount: number;
  overCompletionCount: number;
};

async function api<T>(path: string, init?: RequestInit): Promise<{ data: T; meta?: Envelope<T>["meta"] }> {
  return apiJsonWithMeta<T>(path, init);
}

export async function listProgress(
  projectId: string,
  opts?: { status?: string; boqItemId?: string; signal?: AbortSignal }
): Promise<ProgressUpdate[]> {
  const q = new URLSearchParams();
  if (opts?.status) q.set("status", opts.status);
  if (opts?.boqItemId) q.set("boqItemId", opts.boqItemId);
  const qs = q.toString() ? `?${q}` : "";
  const { data } = await api<{ updates: ProgressUpdate[] }>(
    `/api/v1/projects/${projectId}/progress${qs}`,
    opts?.signal ? { signal: opts.signal } : undefined
  );
  return data.updates;
}

export async function getProgressSummary(
  projectId: string,
  init?: RequestInit
): Promise<ProgressSummary> {
  const { data } = await api<ProgressSummary>(
    `/api/v1/projects/${projectId}/progress/summary`,
    init
  );
  return data;
}

export async function createProgress(
  projectId: string,
  payload: {
    boqItemId: string;
    completedQty?: string;
    completionPct?: number;
    comment?: string;
    progressDate?: string;
    submitDirectly?: boolean;
    adminOverrideReason?: string;
    revisionOf?: string | null;
  }
): Promise<ProgressUpdate> {
  const { data } = await api<ProgressUpdate>(`/api/v1/projects/${projectId}/progress`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
  return data;
}

export async function reviewProgress(
  projectId: string,
  updateId: string,
  payload: { action: "Approve" | "Return"; reviewComment: string }
): Promise<ProgressUpdate> {
  const { data } = await api<ProgressUpdate>(
    `/api/v1/projects/${projectId}/progress/${updateId}/review`,
    { method: "POST", body: JSON.stringify(payload) }
  );
  return data;
}
