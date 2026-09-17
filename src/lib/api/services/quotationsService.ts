import { apiJson } from "@/lib/api/http";

type Envelope<T> = {
  success: boolean;
  data: T | null;
  error: { code: string; message: string } | null;
};

export type QuotationRow = {
  id: string;
  tenderId: string;
  projectId: string;
  contractorOrgId: string;
  reference: string;
  quotationDate: string;
  amount: string;
  currency: string;
  durationDays: number;
  notes: string | null;
  documentIds: string[];
  documentsCount: number;
  isAwarded: boolean;
  submittedBy: string;
  createdAt: string;
  updatedAt: string;
};

export type ComparisonItem = {
  quotationId: string;
  contractorOrg: {
    id: string;
    name: string;
    crNumber: string;
    complianceStatus: string;
  };
  reference: string;
  amount: string;
  varianceToBudget: string;
  varianceToBudgetAmount: string;
  durationDays: number;
  durationVarianceDays: number;
  isLowestPrice: boolean;
  isShortestDuration: boolean;
  documentsCount: number;
  submittedAt: string;
  isAwarded: boolean;
};

export type ComparisonResult = {
  tenderId: string;
  tenderTitle: string;
  tenderStatus: string;
  originalBudget: string;
  plannedDurationDays: number;
  quotations: ComparisonItem[];
};

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  return apiJson<T>(path, init);
}

function base(projectId: string, tenderId: string) {
  return `/api/v1/projects/${projectId}/tenders/${tenderId}/quotations`;
}

export async function listQuotations(projectId: string, tenderId: string): Promise<QuotationRow[]> {
  return api(base(projectId, tenderId));
}

export async function submitQuotation(
  projectId: string,
  tenderId: string,
  payload: {
    reference: string;
    amount: string;
    currency?: string;
    durationDays: number;
    notes?: string;
    documentIds?: string[];
  }
): Promise<QuotationRow> {
  return api(base(projectId, tenderId), { method: "POST", body: JSON.stringify(payload) });
}

export async function patchQuotation(
  projectId: string,
  tenderId: string,
  id: string,
  payload: { amount?: string; durationDays?: number; notes?: string | null }
): Promise<QuotationRow> {
  return api(`${base(projectId, tenderId)}/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
}

export async function getQuotationComparison(
  projectId: string,
  tenderId: string
): Promise<ComparisonResult> {
  return api(`${base(projectId, tenderId)}/comparison`);
}
