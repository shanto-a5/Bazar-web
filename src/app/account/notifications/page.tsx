"use client";

import { useEffect, useState } from "react";
import { Badge, Button, EmptyState, Spinner, cn } from "@/components/ui";
import { getBrowserApi } from "@/lib/api/bazar-api";
import { formatRelative } from "@/lib/format";
import type { NotificationDto } from "@/lib/types";
import { requestBrowserPushToken } from "@/lib/firebase-messaging";

export default function NotificationsPage() {
  const api = getBrowserApi();
  const [items, setItems] = useState<NotificationDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pushMessage, setPushMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    api
      .notifications()
      .then((result) => {
        if (!active) return;
        setItems(result.notifications);
        window.dispatchEvent(new CustomEvent("bazar:notification-sync", { detail: result }));
      })
      .catch(() => active && setError("Could not load your notifications."));
    return () => {
      active = false;
    };
  }, [api]);

  useEffect(() => {
    const sync = (event: Event) => {
      const detail = (event as CustomEvent<{ notifications: NotificationDto[] }>).detail;
      if (detail?.notifications) setItems(detail.notifications);
    };
    window.addEventListener("bazar:notification-sync", sync);
    return () => window.removeEventListener("bazar:notification-sync", sync);
  }, []);

  async function enablePush() {
    setBusy(true);
    setPushMessage(null);
    try {
      const token = await requestBrowserPushToken();
      await api.registerPushDevice(token);
      setPushMessage("Browser notifications are enabled on this device.");
    } catch (cause) {
      setPushMessage(cause instanceof Error ? cause.message : "Browser notifications could not be enabled.");
    } finally { setBusy(false); }
  }

  async function markRead(id: string) {
    setItems((prev) => (prev ? prev.map((n) => (n.id === id ? { ...n, read: true } : n)) : prev));
    try {
      await api.markNotificationRead(id);
      const count = await api.unreadNotificationCount();
      window.dispatchEvent(new CustomEvent("bazar:notification-sync", { detail: count }));
    } catch {
      /* optimistic; a refresh would correct it */
    }
  }

  async function markAll() {
    setBusy(true);
    try {
      await api.markAllNotificationsRead();
      setItems((prev) => (prev ? prev.map((n) => ({ ...n, read: true })) : prev));
      window.dispatchEvent(new CustomEvent("bazar:notification-sync", { detail: { unreadCount: 0 } }));
    } catch {
      setError("Could not update notifications.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setItems((prev) => (prev ? prev.filter((n) => n.id !== id) : prev));
    try {
      await api.deleteNotification(id);
      const count = await api.unreadNotificationCount();
      window.dispatchEvent(new CustomEvent("bazar:notification-sync", { detail: count }));
    } catch {
      setError("Could not delete the notification.");
    }
  }

  if (error && !items) return <EmptyState title="Something went wrong" description={error} />;
  if (!items) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="text-brand-500" />
      </div>
    );
  }

  const hasUnread = items.some((n) => !n.read);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink">Notifications</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={busy} onClick={enablePush}>Enable browser notifications</Button>
          {hasUnread && <Button variant="outline" size="sm" disabled={busy} onClick={markAll}>Mark all read</Button>}
        </div>
      </div>
      {pushMessage && <p className="text-sm text-ink-muted" role="status">{pushMessage}</p>}

      {items.length === 0 ? (
        <EmptyState title="No notifications" description="Order updates and offers will appear here." />
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((notification) => (
            <li key={notification.id}>
              <div className={cn("flex items-start gap-3 rounded-[var(--radius-card)] border p-4", notification.read ? "border-line bg-surface" : "border-brand-200 bg-brand-50/40")}>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className={cn("text-sm text-ink", !notification.read && "font-semibold")}>{notification.title}</p>
                    {!notification.read && <Badge tone="brand">New</Badge>}
                  </div>
                  <p className="mt-0.5 text-sm text-ink-muted">{notification.body}</p>
                  <p className="mt-1 text-xs text-ink-faint">{formatRelative(notification.createdAt)}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  {!notification.read && (
                    <button type="button" className="text-xs font-medium text-brand-600 hover:underline" onClick={() => markRead(notification.id)}>
                      Mark read
                    </button>
                  )}
                  <button type="button" className="text-xs font-medium text-ink-faint hover:text-danger" onClick={() => remove(notification.id)}>
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
