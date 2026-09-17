import { getApiBaseUrl } from "@/lib/api/baseUrl";
import { apiJson as httpJson, apiRaw } from "@/lib/api/http";

type Envelope<T> = {
  success: boolean;
  data: T | null;
  error: { code: string; message: string } | null;
};

export type BoqValidationReport = {
  isValid: boolean;
  totalRowsScanned: number;
  validRowsCount: number;
  errorRowsCount: number;
  errors: Array<{
    rowNumber: number;
    itemCode: string;
    field: string;
    issue: string;
    receivedValue: unknown;
  }>;
  warnings: string[];
  totalImportValue: string;
  contractValue: string;
  valueVariance: string;
  hasContractValueMismatch: boolean;
  previewRows: Array<{
    itemCode: string;
    sectionPath: string[];
    description: string;
    unit: string;
    contractQty: string;
    unitRate: string;
    boqAmount: string;
  }>;
  fileKey: string | null;
};

export type BoqItemRow = {
  id: string;
  itemCode: string;
  sectionPath: string[];
  level: number;
  description: string;
  unit: string;
  contractQty: string;
  unitRate: string;
  boqAmount: string;
  isBaseline: boolean;
  sortOrder: number;
};

async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  return httpJson<T>(path, init);
}

export function boqTemplateUrl(projectId: string, format: "xlsx" | "csv" = "xlsx"): string {
  return `${getApiBaseUrl()}/api/v1/projects/${projectId}/boq/template?format=${format}`;
}

export async function downloadBoqTemplate(projectId: string, format: "xlsx" | "csv" = "xlsx"): Promise<void> {
  const res = await apiRaw(`/api/v1/projects/${projectId}/boq/template?format=${format}`);
  if (!res.ok) throw new Error(`Template download failed (${res.status})`);
  const blob = await res.blob();
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = format === "csv" ? "opc-boq-template.csv" : "opc-boq-template.xlsx";
  a.click();
  URL.revokeObjectURL(a.href);
}

export async function validateBoqImport(projectId: string, file: File): Promise<BoqValidationReport> {
  const fd = new FormData();
  fd.append("file", file);
  return apiJson(`/api/v1/projects/${projectId}/boq/validate-import`, {
    method: "POST",
    body: fd
  });
}

export async function commitBoqImport(
  projectId: string,
  fileKey: string,
  replaceExistingDrafts = true
): Promise<{
  importedItemsCount: number;
  totalBoqAmount: string;
  hasContractValueMismatch: boolean;
  valueVariance: string;
}> {
  return apiJson(`/api/v1/projects/${projectId}/boq/commit-import`, {
    method: "POST",
    body: JSON.stringify({ fileKey, replaceExistingDrafts })
  });
}

export async function listBoqItems(projectId: string, init?: RequestInit): Promise<BoqItemRow[]> {
  return apiJson(`/api/v1/projects/${projectId}/boq/items`, init);
}

export type BoqSummary = {
  projectId: string;
  currency: string;
  contractValue: string;
  totalBoqAmount: string;
  varianceAmount: string;
  variancePercentage: number;
  hasContractValueMismatch: boolean;
  isBaselineLocked: boolean;
  baselineLockedAt: string | null;
  baselineLockedBy: string | null;
  totalItemCount: number;
  leafItemCount: number;
  sectionCount: number;
};

export type BoqTreeNode = BoqItemRow & {
  parentId: string | null;
  childrenCount: number;
  children?: BoqTreeNode[];
};

export async function getBoqSummary(projectId: string, init?: RequestInit): Promise<BoqSummary> {
  return apiJson(`/api/v1/projects/${projectId}/boq/summary`, init);
}

export async function getBoqTree(projectId: string, init?: RequestInit): Promise<BoqTreeNode[]> {
  const data = await apiJson<{ items: BoqTreeNode[] }>(
    `/api/v1/projects/${projectId}/boq?view=tree`,
    init
  );
  return data.items;
}

export async function patchBoqItem(
  projectId: string,
  itemId: string,
  payload: { description?: string; contractQty?: string; unitRate?: string; unit?: string }
): Promise<BoqItemRow> {
  return apiJson(`/api/v1/projects/${projectId}/boq/items/${itemId}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export async function lockBoqBaseline(
  projectId: string,
  payload: { mismatchAcknowledged?: boolean; mismatchReason?: string }
): Promise<{ isBaseline: boolean; totalBoqAmount: string; hasContractValueMismatch: boolean }> {
  return apiJson(`/api/v1/projects/${projectId}/boq/lock-baseline`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export type BoqItemExposure = {
  contractQty: string;
  unitRate: string;
  boqAmount: string;
  currency: string;
  physicalCompletedQty: string;
  physicalCompletionPct: number;
  physicalCompletedValue: string;
  lastProgressDate: string | null;
  claimedQty: string;
  claimedValue: string;
  claimedPct: number;
  certifiedQty: string;
  certifiedValue: string;
  certifiedPct: number;
  lastCertifiedDate: string | null;
  invoicedValue: string;
  invoicedPct: number;
  paidValue: string;
  paidPct: number;
  unbilledPhysicalValue: string;
  unbilledPhysicalQty: string;
  isOverCertified: boolean;
  overCertifiedDelta: string;
};

export type BoqItemDetail = {
  id: string;
  projectId: string;
  itemCode: string;
  description: string;
  unit: string;
  level: number;
  sectionPath: string[];
  isBaseline: boolean;
  baselineLockedAt: string | null;
  exposure: BoqItemExposure;
  recentUpdatesCount: number;
  wipCertificatesCount: number;
};

export async function getBoqItemDetail(projectId: string, itemId: string): Promise<BoqItemDetail> {
  return apiJson(`/api/v1/projects/${projectId}/boq/items/${itemId}`);
}

export async function getBoqItemProgressHistory(
  projectId: string,
  itemId: string
): Promise<{ updates: Array<Record<string, unknown>> }> {
  return apiJson(`/api/v1/projects/${projectId}/boq/items/${itemId}/progress-history`);
}

export async function getBoqItemWipHistory(
  projectId: string,
  itemId: string
): Promise<{ records: Array<Record<string, unknown>> }> {
  return apiJson(`/api/v1/projects/${projectId}/boq/items/${itemId}/wip-history`);
}

export async function getBoqItemEvidence(
  projectId: string,
  itemId: string
): Promise<{ items: Array<{ id: string; fileName: string; fileKey: string; mimeType: string }> }> {
  return apiJson(`/api/v1/projects/${projectId}/boq/items/${itemId}/evidence`);
}
