import { apiJson } from "@/lib/api/http";

type Envelope<T> = {
  success: boolean;
  data: T | null;
  error: { code: string; message: string } | null;
};

export type TenderRow = {
  id: string;
  projectId: string;
  title: string;
  reference: string;
  status: string;
  issueDate: string | null;
  closingDate: string;
  packageDocumentIds: string[];
  packageDocumentCount: number;
  invitedContractorOrgIds: string[];
  invitedCount: number;
  awardedQuotationId: string | null;
  cancellationReason: string | null;
  hoursUntilClose: number;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
};

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  return apiJson<T>(path, init);
}

export async function listTenders(projectId: string, init?: RequestInit): Promise<TenderRow[]> {
  return api(`/api/v1/projects/${projectId}/tenders`, init);
}

export async function getTender(projectId: string, id: string): Promise<TenderRow> {
  return api(`/api/v1/projects/${projectId}/tenders/${id}`);
}

export async function createTender(
  projectId: string,
  payload: {
    title: string;
    reference: string;
    closingDate: string;
    packageDocumentIds?: string[];
    invitedContractorOrgIds?: string[];
  }
): Promise<TenderRow> {
  return api(`/api/v1/projects/${projectId}/tenders`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function issueTender(projectId: string, id: string): Promise<TenderRow> {
  return api(`/api/v1/projects/${projectId}/tenders/${id}/issue`, { method: "POST", body: "{}" });
}

export async function closeTender(projectId: string, id: string): Promise<TenderRow> {
  return api(`/api/v1/projects/${projectId}/tenders/${id}/close`, { method: "POST", body: "{}" });
}

export async function cancelTender(projectId: string, id: string, reason: string): Promise<TenderRow> {
  return api(`/api/v1/projects/${projectId}/tenders/${id}/cancel`, {
    method: "POST",
    body: JSON.stringify({ reason })
  });
}

export async function addTenderInvitees(
  projectId: string,
  id: string,
  organizationIds: string[]
): Promise<TenderRow> {
  return api(`/api/v1/projects/${projectId}/tenders/${id}/invitees`, {
    method: "POST",
    body: JSON.stringify({ organizationIds })
  });
}

export type AwardResult = {
  tenderId: string;
  tenderStatus: string;
  awardedQuotationId: string;
  contractId: string;
  contractReference: string;
  contractValue: string;
  contractorOrgId: string;
  baselineQuotationId: string;
  awardedAt: string;
};

export async function awardTenderQuotation(
  projectId: string,
  tenderId: string,
  payload: {
    quotationId: string;
    contractReference: string;
    startDate: string;
    completionDate: string;
    retentionPct: number;
    advancePct: number;
    awardNotes: string;
    complianceOverride?: boolean;
  }
): Promise<AwardResult> {
  return api(`/api/v1/projects/${projectId}/tenders/${tenderId}/award`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function getAwardSummary(projectId: string, tenderId: string): Promise<Record<string, unknown>> {
  return api(`/api/v1/projects/${projectId}/tenders/${tenderId}/award-summary`);
}
