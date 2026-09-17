import { apiJson } from "@/lib/api/http";

type Envelope<T> = {
  success: boolean;
  data: T | null;
  meta?: Record<string, unknown>;
  error: { code: string; message: string } | null;
};

async function adminFetch<T>(path: string, init?: RequestInit): Promise<T> {
  return apiJson<T>(path, init);
}

export type OrgRow = {
  id: string;
  name: string;
  type: string;
  crNumber: string | null;
  phone: string | null;
  isActive: boolean;
};

export type UserRow = {
  id: string;
  name: string;
  email: string;
  roles: string[];
  orgId: string;
  isActive: boolean;
};

export function listOrganizations() {
  return adminFetch<OrgRow[]>("/api/v1/organizations");
}

export function createOrganization(payload: Record<string, unknown>) {
  return adminFetch<OrgRow>("/api/v1/organizations", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function listUsers(orgId?: string) {
  const q = orgId ? `?orgId=${encodeURIComponent(orgId)}` : "";
  return adminFetch<UserRow[]>(`/api/v1/users${q}`);
}

export function createUser(payload: Record<string, unknown>) {
  return adminFetch<UserRow>("/api/v1/users", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function deactivateUser(id: string) {
  return adminFetch<UserRow>(`/api/v1/users/${id}/deactivate`, { method: "POST" });
}

export function activateUser(id: string) {
  return adminFetch<UserRow>(`/api/v1/users/${id}/activate`, { method: "POST" });
}

export function assignUserToProject(userId: string, projectId: string, role: string) {
  return adminFetch<{ membershipId: string }>(`/api/v1/users/${userId}/projects`, {
    method: "POST",
    body: JSON.stringify({ projectId, role })
  });
}
