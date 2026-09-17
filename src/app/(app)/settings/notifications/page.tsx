"use client";

import { NotificationBell } from "@/components/navigation/NotificationBell";
import type { NotificationRow } from "@/lib/api/services/notificationService";

const demo: NotificationRow[] = [
  {
    id: "n1",
    type: "WIP_SUBMITTED",
    title: "WIP #01 submitted",
    body: "Contractor submitted WIP for review on Tower A.",
    projectId: "66e6fa0a4b0811e289000001",
    entityType: "WIP",
    entityId: "66e6fa0a4b0811e289000010",
    deepLink: "/projects/66e6fa0a4b0811e289000001/wips/66e6fa0a4b0811e289000010",
    isRead: false,
    readAt: null,
    createdAt: new Date(Date.now() - 2 * 3600_000).toISOString()
  },
  {
    id: "n2",
    type: "INVOICE_OVERDUE",
    title: "Invoice INV-001 overdue",
    body: "Outstanding balance past due date.",
    projectId: "66e6fa0a4b0811e289000001",
    entityType: "Invoice",
    entityId: "66e6fa0a4b0811e289000020",
    deepLink: "/projects/66e6fa0a4b0811e289000001/invoices/66e6fa0a4b0811e289000020",
    isRead: false,
    readAt: null,
    createdAt: new Date(Date.now() - 26 * 3600_000).toISOString()
  },
  {
    id: "n3",
    type: "INVOICE_APPROVED",
    title: "Invoice approved",
    body: "Finance can proceed with payment posting.",
    projectId: "66e6fa0a4b0811e289000001",
    entityType: "Invoice",
    entityId: "66e6fa0a4b0811e289000021",
    deepLink: "/projects/66e6fa0a4b0811e289000001/invoices/66e6fa0a4b0811e289000021",
    isRead: true,
    readAt: new Date().toISOString(),
    createdAt: new Date(Date.now() - 72 * 3600_000).toISOString()
  }
];

/** Demo surface for README_10 NotificationBell (AC-09). */
export default function NotificationsDemoPage() {
  return (
    <main className="opc-admin">
      <p className="opc-admin-crumb">System / Notifications</p>
      <header className="opc-admin-header opc-bell-demo-bar">
        <h1>Notifications</h1>
        <NotificationBell demoItems={demo} demoUnread={2} />
      </header>
      <p className="opc-admin-muted">Open the bell to validate unread badge, gold dots, and slate-50 panel.</p>
    </main>
  );
}
