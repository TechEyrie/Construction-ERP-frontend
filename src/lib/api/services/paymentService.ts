import { apiJson } from "@/lib/api/http";
import type { Invoice } from "./invoiceService";

type Envelope<T> = {
  success: boolean;
  data: T | null;
  error: { code: string; message: string } | null;
};

export type Payment = {
  id: string;
  projectId: string;
  invoiceId: string;
  invoiceNumber?: string;
  paymentDate: string | null;
  amount: string;
  reference: string;
  method: string;
  bank: string | null;
  notes: string | null;
};

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  return apiJson<T>(path, init);
}

export async function recordPayment(
  projectId: string,
  invoiceId: string,
  payload: {
    paymentDate: string;
    amount: string;
    reference: string;
    method?: string;
    bank?: string;
    notes?: string;
  }
): Promise<{
  payment: Payment;
  invoiceUpdate: {
    newStatus: string;
    newOutstanding: string;
    previousStatus: string;
    previousOutstanding: string;
  };
  invoice: Invoice;
}> {
  return api(`/api/v1/projects/${projectId}/invoices/${invoiceId}/payments`, {
    method: "POST",
    body: JSON.stringify({ method: "Bank Transfer", ...payload })
  });
}

export async function listInvoicePayments(
  projectId: string,
  invoiceId: string
): Promise<{
  payments: Payment[];
  summary: {
    totalPaid: string;
    paymentCount: number;
    invoiceNetAmount: string;
    outstandingAmount: string;
    invoiceStatus: string;
  };
}> {
  return api(`/api/v1/projects/${projectId}/invoices/${invoiceId}/payments`);
}

export async function listProjectPayments(projectId: string, init?: RequestInit): Promise<Payment[]> {
  const data = await api<{ payments: Payment[] }>(
    `/api/v1/projects/${projectId}/payments`,
    init
  );
  return data.payments;
}

export async function getPaymentSummary(
  projectId: string,
  init?: RequestInit
): Promise<{
  cumulativePaid: string;
  totalPaymentCount: number;
  cumulativeInvoiced: string;
  paidPercentageOfInvoiced: string;
}> {
  return api(`/api/v1/projects/${projectId}/payments/summary`, init);
}
