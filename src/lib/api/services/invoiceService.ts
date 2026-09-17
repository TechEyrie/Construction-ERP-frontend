import { apiJson } from "@/lib/api/http";

type Envelope<T> = {
  success: boolean;
  data: T | null;
  error: { code: string; message: string } | null;
};

export type Invoice = {
  id: string;
  projectId: string;
  wipId: string;
  wipNumber?: number;
  invoiceNumber: string;
  invoiceDate: string | null;
  dueDate: string | null;
  grossAmount: string;
  deductions: Array<{ description: string; amount: string }>;
  netAmount: string;
  outstandingAmount: string;
  status: string;
  attachmentDocumentIds: string[];
  notes: string | null;
  rejectionReason: string | null;
  isOverdue: boolean;
};

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  return apiJson<T>(path, init);
}

export async function listInvoices(
  projectId: string,
  status?: string,
  init?: RequestInit
): Promise<Invoice[]> {
  const q = status ? `?status=${encodeURIComponent(status)}` : "";
  const data = await api<{ invoices: Invoice[] }>(
    `/api/v1/projects/${projectId}/invoices${q}`,
    init
  );
  return data.invoices;
}

export async function getInvoice(projectId: string, invoiceId: string): Promise<Invoice> {
  return api(`/api/v1/projects/${projectId}/invoices/${invoiceId}`);
}

export async function createInvoice(
  projectId: string,
  payload: {
    wipId: string;
    invoiceDate: string;
    dueDate: string;
    grossAmount: string;
    deductions?: Array<{ description: string; amount: string }>;
    attachmentDocumentIds?: string[];
    notes?: string;
  }
): Promise<Invoice> {
  return api(`/api/v1/projects/${projectId}/invoices`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function updateInvoice(
  projectId: string,
  invoiceId: string,
  payload: {
    grossAmount?: string;
    deductions?: Array<{ description: string; amount: string }>;
    attachmentDocumentIds?: string[];
    notes?: string | null;
  }
): Promise<Invoice> {
  return api(`/api/v1/projects/${projectId}/invoices/${invoiceId}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export async function submitInvoice(projectId: string, invoiceId: string): Promise<Invoice> {
  return api(`/api/v1/projects/${projectId}/invoices/${invoiceId}/submit`, { method: "POST" });
}

export async function approveInvoice(projectId: string, invoiceId: string): Promise<Invoice> {
  return api(`/api/v1/projects/${projectId}/invoices/${invoiceId}/approve`, { method: "POST" });
}

export async function moveInvoiceToFinance(projectId: string, invoiceId: string): Promise<Invoice> {
  return api(`/api/v1/projects/${projectId}/invoices/${invoiceId}/move-to-finance`, { method: "POST" });
}

export async function rejectInvoice(
  projectId: string,
  invoiceId: string,
  rejectionReason: string
): Promise<Invoice> {
  return api(`/api/v1/projects/${projectId}/invoices/${invoiceId}/reject`, {
    method: "POST",
    body: JSON.stringify({ rejectionReason })
  });
}
