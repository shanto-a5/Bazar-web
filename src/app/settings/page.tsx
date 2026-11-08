"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const PREF = "bazar.area-shopping.v1";

export default function SettingsPage() {
  const [enabled, setEnabled] = useState(false);
  const [area, setArea] = useState("");
  useEffect(() => {
    void Promise.resolve().then(() => {
      try { const saved = JSON.parse(localStorage.getItem(PREF) || "{}") as { all?: boolean; area?: string }; setEnabled(Boolean(saved.all)); setArea(saved.area || ""); } catch { /* Storage unavailable. */ }
    });
  }, []);
  function toggle() {
    const next = !enabled; setEnabled(next);
    try { localStorage.setItem(PREF, JSON.stringify({ area, all: next })); } catch { /* Storage unavailable. */ }
  }
  return <section className="container-page max-w-2xl py-10">
    <h1 className="text-2xl font-bold text-ink">Shopping settings</h1>
    <div className="mt-5 flex items-center justify-between rounded-2xl border border-line bg-surface p-5">
      <div><h2 className="font-semibold text-ink">View all products</h2><p className="mt-1 text-sm text-ink-muted">Browse products across all service areas and choose an area from the home page.</p></div>
      <button role="switch" aria-checked={enabled} onClick={toggle} className={`rounded-full px-4 py-2 text-sm font-semibold ${enabled ? "bg-brand-500 text-white" : "bg-surface-muted text-ink"}`}>{enabled ? "On" : "Off"}</button>
    </div>
    <Link href="/" className="mt-5 inline-block font-semibold text-brand-600">Return to shopping</Link>
  </section>;
}
