/* Firebase web messaging uses the public web app config, never server credentials. */
importScripts("https://www.gstatic.com/firebasejs/13.2.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/13.2.0/firebase-messaging-compat.js");
importScripts("/firebase-config.js");

const messaging = firebase.messaging();
messaging.onBackgroundMessage((payload) => {
  const data = payload.data || {};
  const title = payload.notification?.title || "Bazar update";
  const body = payload.notification?.body || "You have a new notification.";
  const path = data.returnId ? `/account/orders/${encodeURIComponent(data.orderId || "")}?return=${encodeURIComponent(data.returnId)}`
    : data.orderId ? `/account/orders/${encodeURIComponent(data.orderId)}` : "/account/notifications";
  self.registration.showNotification(title, { body, data: { path } });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const path = event.notification.data?.path || "/account/notifications";
  const target = new URL(path, self.location.origin).href;
  event.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
    const existing = windows.find((client) => new URL(client.url).origin === self.location.origin);
    if (existing) { existing.navigate(target); return existing.focus(); }
    return clients.openWindow(target);
  }));
});
