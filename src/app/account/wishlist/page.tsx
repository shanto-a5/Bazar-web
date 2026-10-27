"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SafeImage } from "@/components/safe-image";
import { Button, EmptyState, Spinner } from "@/components/ui";
import { getBrowserApi } from "@/lib/api/bazar-api";
import { effectivePrice, formatMoney } from "@/lib/format";
import type { WishlistItemDto } from "@/lib/types";

export default function WishlistPage() {
  const api = getBrowserApi();
  const [items, setItems] = useState<WishlistItemDto[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    api
      .wishlist()
      .then((result) => active && setItems(result.items))
      .catch(() => active && setError("Could not load your wishlist."));
    return () => {
      active = false;
    };
  }, [api]);

  async function remove(productId: string) {
    setBusyId(productId);
    setError(null);
    try {
      const result = await api.removeWishlistItem(productId);
      setItems(result.items);
    } catch {
      setError("Could not remove the item. Please try again.");
    } finally {
      setBusyId(null);
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

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-bold text-ink">Wishlist</h1>
      {error && <p className="text-sm text-danger">{error}</p>}
      {items.length === 0 ? (
        <EmptyState
          title="Your wishlist is empty"
          description="Save products you love and find them here."
          action={<Link href="/catalogue" className="text-sm font-semibold text-brand-600 hover:underline">Browse products</Link>}
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {items.map((item) => (
            <div key={item.productId} className="flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface">
              <Link href={`/product/${item.productId}`} className="aspect-square overflow-hidden bg-surface-muted">
                <SafeImage src={item.product?.images?.[0] ?? null} alt={item.product?.name ?? ""} className="h-full w-full" />
              </Link>
              <div className="flex flex-1 flex-col gap-1 p-3">
                <Link href={`/product/${item.productId}`} className="line-clamp-2 text-sm font-medium text-ink hover:text-brand-600">
                  {item.product?.name ?? ""}
                </Link>
                {item.product && <p className="text-sm font-semibold text-brand-600">{formatMoney(effectivePrice(item.product))}</p>}
                {!item.available && <p className="text-xs font-medium text-danger">Currently unavailable</p>}
                <Button variant="outline" size="sm" className="mt-2" disabled={busyId === item.productId} onClick={() => remove(item.productId)}>
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
