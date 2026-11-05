"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getBrowserApi } from "@/lib/api/bazar-api";
import { listenForBrowserMessages } from "@/lib/firebase-messaging";
import { useSession } from "@/components/session-provider";

export function PushMessageBridge() {
  const router = useRouter();
  const { user } = useSession();
  useEffect(() => {
    let active = true;
    let stop: (() => void) | undefined;
    void listenForBrowserMessages((message) => {
      if (!active) return;
      if (user) void getBrowserApi().notifications().then((result) => {
        window.dispatchEvent(new CustomEvent("bazar:notification-sync", { detail: result }));
      }).catch(() => undefined);
      if ("Notification" in window && Notification.permission === "granted") {
        const notice = new Notification(message.title || "Bazar update", { body: message.body || "You have a new notification." });
        notice.onclick = () => {
          window.focus();
          const data = message.data || {};
          router.push(data.returnId && data.orderId ? `/account/orders/${encodeURIComponent(data.orderId)}?return=${encodeURIComponent(data.returnId)}` : data.orderId ? `/account/orders/${encodeURIComponent(data.orderId)}` : "/account/notifications");
          notice.close();
        };
      }
    }).then((unsubscribe) => { stop = unsubscribe; }).catch(() => undefined);
    return () => { active = false; stop?.(); };
  }, [router, user]);
  return null;
}
