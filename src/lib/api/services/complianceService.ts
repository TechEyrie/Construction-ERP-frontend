import { apiJson } from "@/lib/api/http";

type Envelope<T> = {
  success: boolean;
  data: T | null;
  error: { code: string; message: string } | null;
};

export type ComplianceRow = {
  id: string;
  organizationId: string;
  type: string;
  documentNumber: string;
  issueDate: string;
  expiryDate: string;
  attachmentDocumentId: string;
  notes: string | null;
  computedStatus: "Valid" | "ExpiringSoon" | "Expired";
  daysRemaining: number;
};

export type ComplianceSummary = {
  projectId: string;
  totalDocuments: number;
  validCount: number;
  expiringSoonCount: number;
  expiredCount: number;
  hasAttentionItems: boolean;
  alertDays: number[];
  stakeholderBreakdown: {
    organizationId: string;
    organizationName: string;
    role: string;
    complianceStatus: string;
    criticalAlerts: string[];
    documents: ComplianceRow[];
  }[];
};

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  return apiJson<T>(path, init);
}

export function getComplianceSummary(projectId: string, init?: RequestInit) {
  return api<ComplianceSummary>(`/api/v1/projects/${projectId}/compliance-summary`, init);
}

export function listOrgCompliance(orgId: string) {
  return api<ComplianceRow[]>(`/api/v1/organizations/${orgId}/compliance`);
}

export function addComplianceDocument(
  orgId: string,
  payload: {
    type: string;
    documentNumber: string;
    issueDate: string;
    expiryDate: string;
    attachmentDocumentId: string;
    notes?: string;
  }
) {
  return api<ComplianceRow>(`/api/v1/organizations/${orgId}/compliance`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}
