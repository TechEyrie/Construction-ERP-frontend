import { apiJson } from "@/lib/api/http";

type Envelope<T> = {
  success: boolean;
  data: T | null;
  error: { code: string; message: string } | null;
};

export type FundingSource = {
  id: string;
  projectId: string;
  type: string;
  bankName: string | null;
  facilityReference: string;
  approvedAmount: string;
  currency: string;
  facilityDate: string | null;
  notes: string | null;
  status: string;
  totalDrawn: string;
  remainingFacility: string;
  utilizationPercentage: string;
  transactionCount: number;
};

export type FundingTransaction = {
  id: string;
  projectId: string;
  fundingSourceId: string;
  transactionDate: string | null;
  amount: string;
  reference: string;
  notes: string | null;
  overrideAcknowledged: boolean;
  isArchived: boolean;
};

export type FundingSummary = {
  totalApproved: string;
  totalFundingDrawn: string;
  fundingRemaining: string;
  drawnPercentage: string;
  cumulativePaid: string;
  netLiquidityBuffer: string;
  sourceCount: number;
};

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  return apiJson<T>(path, init);
}

export async function listFundingSources(
  projectId: string,
  init?: RequestInit
): Promise<FundingSource[]> {
  const data = await api<{ sources: FundingSource[] }>(
    `/api/v1/projects/${projectId}/funding/sources`,
    init
  );
  return data.sources;
}

export async function getFundingSummary(
  projectId: string,
  init?: RequestInit
): Promise<FundingSummary> {
  return api(`/api/v1/projects/${projectId}/funding/summary`, init);
}

export async function createFundingSource(
  projectId: string,
  payload: {
    type: "BankLoan" | "OwnerEquity" | "Other";
    bankName?: string;
    facilityReference: string;
    approvedAmount: string;
    facilityDate: string;
    notes?: string;
  }
): Promise<FundingSource> {
  return api(`/api/v1/projects/${projectId}/funding/sources`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function recordDrawdown(
  projectId: string,
  sourceId: string,
  payload: {
    transactionDate: string;
    amount: string;
    reference: string;
    notes?: string;
    overrideAcknowledged?: boolean;
  }
): Promise<{ transaction: FundingTransaction; source: FundingSource }> {
  return api(`/api/v1/projects/${projectId}/funding/sources/${sourceId}/transactions`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function listDrawdowns(
  projectId: string,
  sourceId: string,
  init?: RequestInit
): Promise<FundingTransaction[]> {
  const data = await api<{ transactions: FundingTransaction[] }>(
    `/api/v1/projects/${projectId}/funding/sources/${sourceId}/transactions`,
    init
  );
  return data.transactions;
}

export async function closeFundingSource(
  projectId: string,
  sourceId: string,
  status: "Active" | "Closed"
): Promise<FundingSource> {
  return api(`/api/v1/projects/${projectId}/funding/sources/${sourceId}`, {
    method: "PATCH",
    body: JSON.stringify({ status })
  });
}
