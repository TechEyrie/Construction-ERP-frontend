"use client";

import { useEffect, useState } from "react";
import {
  getUnreadCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationRow
} from "@/lib/api/services/notificationService";
import { getAccessToken } from "@/lib/auth/session";

function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return "—";
  const m = Math.floor(ms / 60000);
  if (m < 60) return `${Math.max(1, m)}m ago`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

type Props = {
  /** When set, skip API and render demo data (AC-09 token preview). */
  demoItems?: NotificationRow[];
  demoUnread?: number;
};

/** AC-09: header notification bell + popover/drawer. */
export function NotificationBell({ demoItems, demoUnread }: Props) {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(demoUnread ?? 0);
  const [items, setItems] = useState<NotificationRow[]>(demoItems ?? []);
  const demo = Boolean(demoItems);

  useEffect(() => {
    if (demo || !getAccessToken()) return;
    void (async () => {
      try {
        const c = await getUnreadCount();
        setUnread(c.unreadCount);
      } catch {
        /* ignore until signed in */
      }
    })();
  }, [demo]);

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (!next || demo) return;
    try {
      const rows = await listNotifications(20);
      setItems(rows);
      const c = await getUnreadCount();
      setUnread(c.unreadCount);
    } catch {
      setItems([]);
    }
  }

  const badge = unread > 99 ? "99+" : String(unread);

  return (
    <div className="opc-bell">
      <button
        type="button"
        className="opc-bell-btn"
        aria-label="Notifications"
        aria-expanded={open}
        onClick={() => void toggle()}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 22a2 2 0 0 0 2-2h-4a2 2 0 0 0 2 2Zm6-6V11a6 6 0 1 0-12 0v5l-2 2v1h16v-1l-2-2Z"
            fill="currentColor"
          />
        </svg>
        {unread > 0 ? <span className="opc-bell-badge">{badge}</span> : null}
      </button>

      {open ? (
        <>
          <button
            type="button"
            className="opc-bell-backdrop"
            aria-label="Close notifications"
            onClick={() => setOpen(false)}
          />
          <div className="opc-bell-panel" role="dialog" aria-label="Notifications">
            <header className="opc-bell-header">
              <h2>Notifications</h2>
              <div className="opc-bell-header-actions">
                <a className="opc-bell-view-all" href="/action-centre" onClick={() => setOpen(false)}>
                  View all
                </a>
                <button
                  type="button"
                  className="opc-bell-mark-all"
                  onClick={() => {
                    if (demo) {
                      setItems((rows) => rows.map((r) => ({ ...r, isRead: true })));
                      setUnread(0);
                      return;
                    }
                    void markAllNotificationsRead().then(async () => {
                      setUnread(0);
                      setItems((rows) => rows.map((r) => ({ ...r, isRead: true })));
                    });
                  }}
                >
                  Mark all read
                </button>
              </div>
            </header>
            <ul className="opc-bell-list">
              {items.length === 0 ? (
                <li className="opc-bell-empty">No notifications</li>
              ) : (
                items.map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      className={`opc-bell-item${n.isRead ? "" : " opc-bell-item-unread"}`}
                      onClick={() => {
                        if (!n.isRead) {
                          if (demo) {
                            setItems((rows) =>
                              rows.map((r) => (r.id === n.id ? { ...r, isRead: true } : r))
                            );
                            setUnread((u) => Math.max(0, u - 1));
                          } else {
                            void markNotificationRead(n.id).then(() => {
                              setItems((rows) =>
                                rows.map((r) => (r.id === n.id ? { ...r, isRead: true } : r))
                              );
                              setUnread((u) => Math.max(0, u - 1));
                            });
                          }
                        }
                        if (!demo && n.deepLink) {
                          window.location.href = n.deepLink;
                        }
                      }}
                    >
                      {!n.isRead ? <span className="opc-bell-dot" aria-hidden="true" /> : null}
                      <span className="opc-bell-icon" aria-hidden="true" />
                      <span className="opc-bell-copy">
                        <span className="opc-bell-title">{n.title}</span>
                        <span className="opc-bell-body">{n.body}</span>
                      </span>
                      <time className="opc-bell-time" dateTime={n.createdAt}>
                        {relativeTime(n.createdAt)}
                      </time>
                    </button>
                  </li>
                ))
              )}
            </ul>
            <footer className="opc-bell-footer">
              <button type="button" onClick={() => setOpen(false)}>
                Close
              </button>
            </footer>
          </div>
        </>
      ) : null}
    </div>
  );
}
