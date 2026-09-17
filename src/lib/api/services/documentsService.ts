import { getApiBaseUrl } from "@/lib/api/baseUrl";
import { apiJsonWithMeta } from "@/lib/api/http";

type Envelope<T> = {
  success: boolean;
  data: T | null;
  error: { code: string; message: string } | null;
  meta?: { pagination?: { page: number; limit: number; totalRecords: number; totalPages: number } };
};

export type DocumentRow = {
  id: string;
  projectId: string;
  category: string;
  title: string;
  revision: string;
  documentDate: string;
  notes: string | null;
  fileKey: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  checksum: string;
  isSuperseded: boolean;
  supersedesDocumentId: string | null;
  signedStatus: string | null;
  uploadedBy: { id: string; name: string };
  uploadedAt: string;
  isArchived: boolean;
};

async function api<T>(
  path: string,
  init?: RequestInit
): Promise<{ data: T; pagination?: Envelope<T>["meta"] extends infer M ? M extends { pagination?: infer P } ? P : never : never }> {
  const res = await apiJsonWithMeta<T>(path, init);
  return { data: res.data, pagination: (res.meta as { pagination?: never } | undefined)?.pagination as never };
}

export async function listDocuments(
  projectId: string,
  opts: {
    category?: string;
    includeSuperseded?: boolean;
    search?: string;
    signal?: AbortSignal;
  } = {}
): Promise<{ items: DocumentRow[]; totalRecords: number }> {
  const q = new URLSearchParams();
  if (opts.category) q.set("category", opts.category);
  if (opts.includeSuperseded) q.set("includeSuperseded", "true");
  if (opts.search?.trim()) q.set("search", opts.search.trim());
  q.set("limit", "100");
  const { data, pagination } = await api<DocumentRow[]>(
    `/api/v1/projects/${projectId}/documents?${q.toString()}`,
    opts.signal ? { signal: opts.signal } : undefined
  );
  return { items: data, totalRecords: pagination?.totalRecords ?? data.length };
}

export async function uploadProjectDocument(opts: {
  projectId: string;
  file: File;
  category: string;
  title: string;
  revision?: string;
}): Promise<DocumentRow> {
  const form = new FormData();
  form.append("file", opts.file);
  form.append("category", opts.category);
  form.append("title", opts.title);
  if (opts.revision) form.append("revision", opts.revision);
  const { data } = await api<DocumentRow>(`/api/v1/projects/${opts.projectId}/documents`, {
    method: "POST",
    body: form
  });
  return data;
}

export async function uploadDocumentRevision(opts: {
  projectId: string;
  documentId: string;
  file: File;
  revision: string;
  notes?: string;
}): Promise<DocumentRow> {
  const form = new FormData();
  form.append("file", opts.file);
  form.append("revision", opts.revision);
  if (opts.notes) form.append("notes", opts.notes);
  const { data } = await api<DocumentRow>(
    `/api/v1/projects/${opts.projectId}/documents/${opts.documentId}/revision`,
    { method: "POST", body: form }
  );
  return data;
}

export async function getDocumentHistory(
  projectId: string,
  documentId: string
): Promise<DocumentRow[]> {
  const { data } = await api<DocumentRow[]>(
    `/api/v1/projects/${projectId}/documents/${documentId}/history`
  );
  return data;
}

export function downloadUrl(fileKey: string): string {
  return `${getApiBaseUrl()}/api/v1/files/${encodeURIComponent(fileKey)}/download`;
}
