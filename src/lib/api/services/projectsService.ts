import { apiJson } from "@/lib/api/http";

type Envelope<T> = {
  success: boolean;
  data: T | null;
  error: { code: string; message: string } | null;
};

export type AssignedProject = {
  projectId: string;
  projectCode: string;
  projectName: string;
  role: string;
};

export type AccessCheck = {
  hasAccess: boolean;
  projectId: string;
  assignedRole: string;
  grantedAt: string;
  capabilities: string[];
};

export type ProjectRow = {
  id: string;
  name: string;
  code: string;
  location: string;
  description: string | null;
  ownerOrgId: string;
  consultantOrgId: string | null;
  contractorOrgId: string | null;
  status: string;
  plannedStartDate: string;
  plannedEndDate: string;
  originalBudget: string;
  contractValue: string;
  currency: string;
  fundingType: string;
  settings: Record<string, unknown>;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ProjectSummary = {
  projectId: string;
  name: string;
  code: string;
  status: string;
  currency: string;
  contractValue: string;
  originalBudget: string;
  plannedStartDate: string;
  plannedEndDate: string;
  plannedDurationDays: number;
  elapsedDays: number;
  timeElapsedPct: number;
  isOverdue: boolean;
  assignedStakeholders: {
    owner: string | null;
    consultant: string | null;
    contractor: string | null;
  };
};

export type CreateProjectPayload = {
  name: string;
  code: string;
  location: string;
  description?: string;
  ownerOrgId: string;
  consultantOrgId?: string;
  contractorOrgId?: string;
  plannedStartDate: string;
  plannedEndDate: string;
  originalBudget: string;
  contractValue: string;
  currency: string;
  fundingType: "BankLoan" | "OwnerEquity" | "Other";
  settings?: {
    progressMethod?: string;
    retentionPct?: number;
    advancePct?: number;
    allowMaterialsOnSite?: boolean;
    vatPct?: number;
  };
};

async function authFetch<T>(path: string, init?: RequestInit): Promise<T> {
  return apiJson<T>(path, init);
}

export function listMyProjects(init?: RequestInit) {
  return authFetch<AssignedProject[]>("/api/v1/users/me/projects", init);
}

export function checkProjectAccess(projectId: string, init?: RequestInit) {
  return authFetch<AccessCheck>(`/api/v1/projects/${projectId}/access-check`, init);
}

export function listProjects(init?: RequestInit) {
  return authFetch<ProjectRow[]>("/api/v1/projects", init);
}

export function getProject(projectId: string, init?: RequestInit) {
  return authFetch<ProjectRow>(`/api/v1/projects/${projectId}`, init);
}

export function getProjectSummary(projectId: string, init?: RequestInit) {
  return authFetch<ProjectSummary>(`/api/v1/projects/${projectId}/summary`, init);
}

export function createProject(payload: CreateProjectPayload) {
  return authFetch<ProjectRow>("/api/v1/projects", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export type OrgRow = { id: string; name: string; type: string };

export function listOrganizations(init?: RequestInit) {
  return authFetch<OrgRow[]>("/api/v1/organizations", init);
}
