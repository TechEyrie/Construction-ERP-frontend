import { apiJson } from "@/lib/api/http";

type Envelope<T> = {
  success: boolean;
  data: T | null;
  error: { code: string; message: string } | null;
  meta?: Record<string, unknown>;
};

export type DashboardKpis = {
  contractValue: string | null;
  physicalProgressPct: string | null;
  completedValue: string | null;
  baselineBoqValue: string | null;
  cumulativeCertified: string | null;
  certifiedPctOfContract: string | null;
  cumulativeInvoiced: string | null;
  invoicedPctOfContract: string | null;
  cumulativePaid: string | null;
  paidPctOfContract: string | null;
  fundingDrawn: string | null;
  fundingRemaining: string | null;
  fundingDrawnPctOfApproved: string | null;
  fundingApproved: string | null;
  outstandingInvoiceBalance: string | null;
  outstandingCertifiedNotPaid: string | null;
  timeElapsedPct: string | null;
  elapsedDays?: number;
  plannedDurationDays?: number;
  netLiquidityBuffer: string | null;
  isLiquidityDeficit: boolean | null;
};

export type AttentionItem = {
  id: string;
  category: string;
  severity: "danger" | "warning" | "info";
  title: string;
  body: string;
  deepLink: string;
};

export type DashboardPayload = {
  asOf: string;
  projectId: string;
  projectCode: string;
  projectName: string;
  currency: string;
  projectStatus: string;
  viewerRoleProjection: string;
  kpis: DashboardKpis;
  attention: {
    items: AttentionItem[];
    countBySeverity: { danger: number; warning: number; info: number };
  };
  trends: {
    currency: string;
    months: number;
    points: Array<{
      month: string;
      paid: string;
      completedValue: string;
      certifiedValue: string | null;
    }>;
  } | null;
};

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  return apiJson<T>(path, init);
}

export async function getProjectDashboard(
  projectId: string,
  init?: RequestInit
): Promise<DashboardPayload> {
  return api(`/api/v1/projects/${projectId}/dashboard`, init);
}
