import { apiJson } from "@/lib/api/http";

type Envelope<T> = {
  success: boolean;
  data: T | null;
  error: { code: string; message: string } | null;
};

export type WipLine = {
  id: string;
  boqItemId: string;
  itemCode: string;
  description: string;
  unit: string;
  contractQty: string;
  unitRate: string;
  previousCertifiedQty: string;
  currentClaimedQty: string;
  cumulativeClaimedQty: string;
  currentClaimedValue: string;
  certifiedQty: string;
  certifiedValue: string;
  currentCertifiedQty: string;
  currentCertifiedValue: string;
  remark: string | null;
};

export type Wip = {
  id: string;
  projectId: string;
  wipNumber: number;
  periodStart: string | null;
  periodEnd: string | null;
  status: string;
  totalClaimedValue: string;
  materialsOnSiteValue: string;
  retentionAmount: string;
  advanceRecoveryAmount: string;
  otherDeductions: Array<{ description: string; amount: string }>;
  netClaimedValue: string;
  totalCertifiedValue: string;
  certifiedRetentionAmount: string;
  certifiedAdvanceRecoveryAmount: string;
  netCertifiedValue: string;
  attachmentDocumentIds: string[];
  submittedAt: string | null;
  certifiedAt: string | null;
  lineItems?: WipLine[];
};

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  return apiJson<T>(path, init);
}

export async function listWips(
  projectId: string,
  status?: string,
  init?: RequestInit
): Promise<Wip[]> {
  const q = status ? `?status=${encodeURIComponent(status)}` : "";
  const data = await api<{ wips: Wip[] }>(`/api/v1/projects/${projectId}/wips${q}`, init);
  return data.wips;
}

export async function getWip(projectId: string, wipId: string): Promise<Wip> {
  return api(`/api/v1/projects/${projectId}/wips/${wipId}`);
}

export async function createWip(
  projectId: string,
  payload: {
    periodStart: string;
    periodEnd: string;
    autoPopulateFromProgress?: boolean;
    materialsOnSiteValue?: string;
    attachmentDocumentIds?: string[];
  }
): Promise<Wip> {
  return api(`/api/v1/projects/${projectId}/wips`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function updateWipLine(
  projectId: string,
  wipId: string,
  lineId: string,
  payload: { currentClaimedQty?: string; cumulativeClaimedQty?: string; remark?: string }
): Promise<{ wip: Wip; line: WipLine }> {
  return api(`/api/v1/projects/${projectId}/wips/${wipId}/line-items/${lineId}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export async function autoFillWip(projectId: string, wipId: string): Promise<Wip> {
  return api(`/api/v1/projects/${projectId}/wips/${wipId}/auto-fill-progress`, { method: "POST" });
}

export async function patchWipHeader(
  projectId: string,
  wipId: string,
  payload: {
    materialsOnSiteValue?: string;
    otherDeductions?: Array<{ description: string; amount: string }>;
    attachmentDocumentIds?: string[];
  }
): Promise<Wip> {
  return api(`/api/v1/projects/${projectId}/wips/${wipId}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export async function submitWip(projectId: string, wipId: string): Promise<Wip> {
  return api(`/api/v1/projects/${projectId}/wips/${wipId}/submit`, { method: "POST" });
}

export async function deleteDraftWip(projectId: string, wipId: string): Promise<{ deletedId: string }> {
  return api(`/api/v1/projects/${projectId}/wips/${wipId}`, { method: "DELETE" });
}

export async function startWipReview(projectId: string, wipId: string): Promise<Wip> {
  return api(`/api/v1/projects/${projectId}/wips/${wipId}/start-review`, { method: "POST" });
}

export async function certifyWipLine(
  projectId: string,
  wipId: string,
  lineId: string,
  payload: { certifiedQty: string; remark?: string }
): Promise<{ wip: Wip; line: WipLine }> {
  return api(`/api/v1/projects/${projectId}/wips/${wipId}/line-items/${lineId}/certify`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export async function approveAllAsClaimed(projectId: string, wipId: string): Promise<Wip> {
  return api(`/api/v1/projects/${projectId}/wips/${wipId}/approve-all-claimed`, { method: "POST" });
}

export async function certifyWip(projectId: string, wipId: string): Promise<Wip> {
  return api(`/api/v1/projects/${projectId}/wips/${wipId}/certify`, { method: "POST" });
}

export async function returnWip(projectId: string, wipId: string, returnReason: string): Promise<Wip> {
  return api(`/api/v1/projects/${projectId}/wips/${wipId}/return`, {
    method: "POST",
    body: JSON.stringify({ returnReason })
  });
}
