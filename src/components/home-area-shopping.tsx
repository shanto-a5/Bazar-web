"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ProductGrid } from "@/components/product-card";
import { getBrowserApi } from "@/lib/api/bazar-api";
import { detectAddress } from "@/lib/geocode";
import type { Product } from "@/lib/types";

const PREF = "bazar.area-shopping.v1";
type Area = { name: string; slug: string };

export function HomeAreaShopping({ initialProducts }: { initialProducts: Product[] }) {
  const api = getBrowserApi();
  const [areas, setAreas] = useState<Area[]>([]);
  const [area, setArea] = useState("");
  const [input, setInput] = useState("");
  const [viewAll, setViewAll] = useState(false);
  const [products, setProducts] = useState(initialProducts);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void Promise.resolve().then(() => {
      try {
        const saved = JSON.parse(localStorage.getItem(PREF) || "{}") as { area?: string; all?: boolean };
        setArea(saved.area || ""); setInput(saved.area || ""); setViewAll(Boolean(saved.all));
      } catch { /* Keep defaults if storage is unavailable. */ }
    });
    void api.areas().then(({ areas: result }) => setAreas(result)).catch(() => undefined);
  }, [api]);

  function save(nextArea: string, nextAll = viewAll) {
    setArea(nextArea); setInput(nextArea);
    try { localStorage.setItem(PREF, JSON.stringify({ area: nextArea, all: nextAll })); } catch { /* Private browsing may disable storage. */ }
  }

  useEffect(() => {
    let active = true;
    if (!area && !viewAll) { void Promise.resolve().then(() => setProducts(initialProducts)); return; }
    (async () => {
      await Promise.resolve();
      if (!active) return;
      setLoading(true);
      const items: Product[] = [];
      for (let page = 1; page <= 60; page += 1) {
        const result = await api.products({ page, pageSize: 60, area: area || undefined });
        items.push(...result.items);
        if (items.length >= result.total || result.items.length < 60) break;
      }
      if (active) setProducts(items);
    })().catch(() => { if (active) setProducts([]); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [area, viewAll, api, initialProducts]);

  const chips = useMemo(() => viewAll ? [{ name: "All Areas", slug: "" }, ...areas] : areas, [viewAll, areas]);

  async function detect() {
    const result = await detectAddress();
    if (!result.ok) return;
    const tokens = [result.suggestion.area, result.suggestion.district, result.suggestion.division].filter(Boolean).join(" ").toLowerCase();
    const found = areas.find((candidate) => tokens.includes(candidate.name.toLowerCase()) || tokens.includes(candidate.slug.replaceAll("-", " ")));
    if (found) save(found.slug);
  }

  return <>
    <div className="mb-5 rounded-2xl border border-line bg-surface p-4">
      <label htmlFor="home-area" className="block text-sm font-semibold text-ink">Shop by village or area</label>
      <div className="mt-2 flex gap-2">
        <input id="home-area" value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") save(input.trim()); }} placeholder="Enter your area" className="min-w-0 flex-1 rounded-xl border border-line bg-white px-3 py-2 text-sm" />
        <button onClick={() => save(input.trim())} className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white">Apply</button>
        <button onClick={() => void detect()} className="rounded-xl border border-line px-3 py-2 text-sm">Use GPS</button>
      </div>
      {chips.length > 0 && <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">{chips.map((item) => <button key={item.slug || "all"} onClick={() => save(item.slug)} className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${area === item.slug ? "bg-brand-500 text-white" : "bg-surface-muted text-ink-muted"}`}>{item.name}</button>)}</div>}
    </div>
    {loading ? <p className="py-8 text-center text-sm text-ink-muted">Loading products…</p> : products.length > 0 ? <ProductGrid products={products} /> : <div className="rounded-2xl border border-dashed border-line bg-surface px-6 py-10 text-center text-sm text-ink-muted">No products are listed for this area yet. <Link href="/settings" className="ml-1 font-semibold text-brand-600 underline">Open Settings to view all products</Link></div>}
  </>;
}
