import { apiJson } from "@/lib/api/http";

type Envelope<T> = {
  success: boolean;
  data: T | null;
  error: { code: string; message: string } | null;
};

export type NotificationRow = {
  id: string;
  type: string;
  title: string;
  body: string;
  projectId: string;
  entityType: string;
  entityId: string;
  deepLink: string;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  severity?: "danger" | "warning" | "info";
};

export type ActionCentreData = {
  items: NotificationRow[];
  unreadCount: number;
  countsByType: Record<string, number>;
};

export type ActionCentreSummary = {
  unreadCount: number;
  bySeverity: { danger: number; warning: number; info: number };
  byType: Record<string, number>;
};

export type ActionCentreFilters = {
  projectId?: string;
  isRead?: "true" | "false" | "all";
  type?: string;
  severity?: "danger" | "warning" | "info" | "";
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
};

async function notifFetch<T>(path: string, init?: RequestInit): Promise<T> {
  return apiJson<T>(path, init);
}

export function getUnreadCount() {
  return notifFetch<{ unreadCount: number }>("/api/v1/notifications/unread-count");
}

export function listNotifications(limit = 20) {
  return notifFetch<NotificationRow[]>(`/api/v1/notifications?limit=${limit}`);
}

export function listActionCentre(filters: ActionCentreFilters = {}) {
  const q = new URLSearchParams();
  if (filters.projectId) q.set("projectId", filters.projectId);
  if (filters.isRead && filters.isRead !== "all") q.set("isRead", filters.isRead);
  if (filters.type) q.set("type", filters.type);
  if (filters.severity) q.set("severity", filters.severity);
  if (filters.dateFrom) q.set("dateFrom", filters.dateFrom);
  if (filters.dateTo) q.set("dateTo", filters.dateTo);
  q.set("page", String(filters.page ?? 1));
  q.set("limit", String(filters.limit ?? 25));
  return notifFetch<ActionCentreData>(`/api/v1/action-centre?${q.toString()}`);
}

export function getActionCentreSummary() {
  return notifFetch<ActionCentreSummary>("/api/v1/action-centre/summary");
}

export function markNotificationRead(id: string) {
  return notifFetch<NotificationRow>(`/api/v1/notifications/${id}/read`, { method: "PATCH" });
}

export function markAllNotificationsRead(projectId?: string) {
  return notifFetch<{ markedRead: number }>("/api/v1/notifications/mark-all-read", {
    method: "POST",
    body: JSON.stringify(projectId ? { projectId } : {})
  });
}
