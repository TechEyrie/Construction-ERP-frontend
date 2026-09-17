import { apiJson } from "@/lib/api/http";

export type UploadResult = {
  documentId: string;
  fileKey: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  checksum: string;
  uploadedAt: string;
};

export async function uploadFile(opts: {
  file: File;
  projectId: string;
  category: string;
  title: string;
}): Promise<UploadResult> {
  const form = new FormData();
  form.append("file", opts.file);
  form.append("projectId", opts.projectId);
  form.append("category", opts.category);
  form.append("title", opts.title);

  return apiJson<UploadResult>("/api/v1/files/upload", {
    method: "POST",
    body: form
  });
}
