import { apiJson, apiRaw } from "@/lib/api/http";

type Envelope<T> = {
  success: boolean;
  data: T | null;
  error: { code: string; message: string } | null;
};

export type ReportCatalogItem = {
  key: string;
  title: string;
  description: string;
  allowedFormats: string[];
  accessible: boolean;
};

export type ReportPreview = {
  reportKey: string;
  projectId: string;
  projectCode: string;
  projectName: string;
  currency: string;
  asOf: string;
  rowCount: number;
  columns: string[];
  rows: Record<string, string | number | boolean | null>[];
  footnotes: string[];
  totals?: Record<string, string>;
};

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  return apiJson<T>(path, init);
}

export function listProjectReports(projectId: string, init?: RequestInit) {
  return apiFetch<{ reports: ReportCatalogItem[] }>(
    `/api/v1/projects/${projectId}/reports`,
    init
  );
}

export function getReportPreview(projectId: string, reportKey: string, limit = 50) {
  return apiFetch<ReportPreview>(
    `/api/v1/projects/${projectId}/reports/${reportKey}?format=json&limit=${limit}`
  );
}

export async function downloadReport(
  projectId: string,
  reportKey: string,
  format: "csv" | "xlsx"
): Promise<void> {
  const res = await apiRaw(
    `/api/v1/projects/${projectId}/reports/${reportKey}/export?format=${format}`
  );
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const body = (await res.json()) as Envelope<null>;
      msg = body.error?.message ?? msg;
    } catch {
      /* binary error */
    }
    throw Object.assign(new Error(msg), { status: res.status });
  }

  const mime =
    res.headers.get("Content-Type") ??
    (format === "csv"
      ? "text/csv;charset=utf-8"
      : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  const blob = new Blob([await res.arrayBuffer()], { type: mime });

  const disp = res.headers.get("Content-Disposition") ?? "";
  const star = /filename\*=UTF-8''([^;]+)/i.exec(disp);
  const quoted = /filename="([^"]+)"/i.exec(disp);
  const plain = /filename=([^;]+)/i.exec(disp);
  const rawName = star?.[1] ?? quoted?.[1] ?? plain?.[1]?.trim();
  const name = rawName
    ? decodeURIComponent(rawName.replace(/["']/g, ""))
    : `${reportKey}.${format}`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function ackReportPrint(projectId: string, reportKey: string) {
  return apiFetch<{ acknowledged: boolean }>(
    `/api/v1/projects/${projectId}/reports/${reportKey}/print-ack`,
    { method: "POST", body: "{}" }
  );
}
