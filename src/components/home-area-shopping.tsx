"use client";

import { useEffect, useState } from "react";
import { useArea } from "@/components/area-provider";
import { ProductGrid } from "@/components/product-card";
import { getBrowserApi } from "@/lib/api/bazar-api";
import type { Product } from "@/lib/types";

export function HomeAreaShopping({ initialProducts = [] }: { initialProducts?: Product[] }) {
  const api = getBrowserApi();
  const { hydrated, area, openSelector } = useArea();
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!hydrated || !area) {
      return () => {
        active = false;
      };
    }

    (async () => {
      await Promise.resolve();
      if (!active) return;
      setLoading(true);
      const items: Product[] = [];
      for (let page = 1; page <= 60; page += 1) {
        const result = await api.products({ page, pageSize: 60, area: area.slug });
        items.push(...result.items);
        if (items.length >= result.total || result.items.length < 60) break;
      }
      if (active) setProducts(items);
    })()
      .catch(() => {
        if (active) setProducts([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [api, hydrated, area]);

  if (!hydrated || !area || loading) {
    return (
      <p className="py-12 text-center text-sm text-ink-muted">
        Loading products…
      </p>
    );
  }

  if (products.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-line bg-surface px-6 py-12 text-center">
        <p className="text-base font-bold text-ink">
          এখানে এখনো কোনো দোকান নেই। আমরা স্থানীয় বিক্রেতাদের জানিয়েছি!
        </p>
        <p className="mt-1 text-sm text-ink-muted">
          No shops are available here yet. We have notified local sellers!
        </p>
        <button
          type="button"
          onClick={openSelector}
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-brand-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-600"
        >
          অন্য এলাকা বাছাই করুন · Choose another area
        </button>
      </div>
    );
  }

  return <ProductGrid products={products} />;
}
