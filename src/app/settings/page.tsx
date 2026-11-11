"use client";

import Link from "next/link";
import { useArea } from "@/components/area-provider";

export default function SettingsPage() {
  const { area, openSelector } = useArea();

  return (
    <section className="container-page max-w-2xl py-10">
      <h1 className="text-2xl font-bold text-ink">Shopping settings</h1>
      <div className="mt-5 flex items-center justify-between gap-4 rounded-2xl border border-line bg-surface p-5">
        <div>
          <h2 className="font-semibold text-ink">Shopping area</h2>
          <p className="mt-1 text-sm text-ink-muted">
            {area ? `${area.name} — tap to change your village or area` : "Choose your village or area"}
          </p>
        </div>
        <button
          type="button"
          onClick={openSelector}
          className="shrink-0 rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
        >
          Change area
        </button>
      </div>
      <Link href="/" className="mt-5 inline-block font-semibold text-brand-600">
        Return to shopping
      </Link>
    </section>
  );
}
