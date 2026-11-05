"use client";

import { getApp, getApps, initializeApp } from "firebase/app";
import { getMessaging, getToken, isSupported, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};
export const BROWSER_PUSH_TOKEN_KEY = "bazar.push.token";

export async function requestBrowserPushToken(): Promise<string> {
  if (typeof window === "undefined" || !("Notification" in window) || !("serviceWorker" in navigator)) {
    throw new Error("This browser does not support notifications.");
  }
  if (!(await isSupported())) throw new Error("This browser does not support Firebase messaging.");
  if (Object.values(firebaseConfig).some((value) => !value)) throw new Error("Browser notifications are not configured.");
  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("Notification permission was not granted.");
  const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  const messaging = getMessaging(app);
  const token = await getToken(messaging, { vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY, serviceWorkerRegistration: registration });
  if (!token) throw new Error("The browser did not provide a notification token.");
  try { window.localStorage.setItem(BROWSER_PUSH_TOKEN_KEY, token); } catch { /* registration still works for this session */ }
  return token;
}

export async function getGrantedBrowserPushToken(): Promise<string | null> {
  if (typeof window === "undefined" || !("Notification" in window) || Notification.permission !== "granted" || !("serviceWorker" in navigator)) return null;
  if (!(await isSupported()) || Object.values(firebaseConfig).some((value) => !value)) return null;
  const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  const token = (await getToken(getMessaging(app), { vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY, serviceWorkerRegistration: registration })) || null;
  if (token) { try { window.localStorage.setItem(BROWSER_PUSH_TOKEN_KEY, token); } catch { /* optional token cache */ } }
  return token;
}

export async function listenForBrowserMessages(onNotification: (message: { title?: string; body?: string; data?: Record<string, string> }) => void) {
  if (!(await isSupported()) || Object.values(firebaseConfig).some((value) => !value)) return () => undefined;
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  return onMessage(getMessaging(app), (payload) => onNotification({ title: payload.notification?.title, body: payload.notification?.body, data: payload.data }));
}
