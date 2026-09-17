import { apiJson } from "@/lib/api/http";

type Envelope<T> = {
  success: boolean;
  data: T | null;
  error: { code: string; message: string } | null;
};

export type ContractRow = {
  id: string;
  projectId: string;
  contractorOrgId: string;
  reference: string;
  originalContractAmount: string;
  currency: string;
  awardDate: string;
  startDate: string;
  completionDate: string;
  retentionPct: number;
  advancePct: number;
  status: string;
  signedStatus: string;
  signedDocumentId: string | null;
  durationDays: number;
  isArchived: boolean;
  createdAt: string | null;
  contractor?: {
    id: string;
    name: string;
    crNumber: string | null;
    address: string | null;
  } | null;
  signedDocument?: {
    id: string;
    fileName: string;
    checksum: string;
    uploadedAt: string;
    fileKey: string;
  } | null;
};

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  return apiJson<T>(path, init);
}

export async function getProjectContract(projectId: string, init?: RequestInit): Promise<ContractRow> {
  return api(`/api/v1/projects/${projectId}/contracts`, init);
}

export async function createContract(
  projectId: string,
  payload: {
    contractorOrgId: string;
    reference: string;
    originalContractAmount: string;
    currency: string;
    awardDate: string;
    startDate: string;
    completionDate: string;
    retentionPct?: number;
    advancePct?: number;
  }
): Promise<ContractRow> {
  return api(`/api/v1/projects/${projectId}/contracts`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function activateContract(projectId: string, id: string): Promise<ContractRow> {
  return api(`/api/v1/projects/${projectId}/contracts/${id}/activate`, { method: "POST", body: "{}" });
}

export async function bindSignedDocument(
  projectId: string,
  id: string,
  payload: { documentId: string; signedStatus: string }
): Promise<ContractRow> {
  return api(`/api/v1/projects/${projectId}/contracts/${id}/signed-document`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}
