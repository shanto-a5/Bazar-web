"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SafeImage } from "@/components/safe-image";
import { Button, EmptyState, Spinner, Stars } from "@/components/ui";
import { getBrowserApi } from "@/lib/api/bazar-api";
import type { Store } from "@/lib/types";

export default function FollowingPage() {
  const api = getBrowserApi();
  const [stores, setStores] = useState<Store[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    api
      .followedStores()
      .then((result) => active && setStores(result.stores))
      .catch(() => active && setError("Could not load followed stores."));
    return () => {
      active = false;
    };
  }, [api]);

  async function unfollow(storeId: string) {
    setBusyId(storeId);
    setError(null);
    try {
      await api.unfollowStore(storeId);
      setStores((prev) => (prev ? prev.filter((store) => store.id !== storeId) : prev));
    } catch {
      setError("Could not unfollow the store.");
    } finally {
      setBusyId(null);
    }
  }

  if (error && !stores) return <EmptyState title="Something went wrong" description={error} />;
  if (!stores) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="text-brand-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-bold text-ink">Followed stores</h1>
      {error && <p className="text-sm text-danger">{error}</p>}
      {stores.length === 0 ? (
        <EmptyState
          title="You are not following any stores"
          description="Follow stores to keep up with their latest products."
          action={<Link href="/categories" className="text-sm font-semibold text-brand-600 hover:underline">Browse stores</Link>}
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {stores.map((store) => (
            <li key={store.id} className="flex items-center gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-4">
              <Link href={`/store/${store.id}`} className="h-14 w-14 shrink-0 overflow-hidden rounded-full border border-line bg-surface-muted">
                <SafeImage src={store.logo} alt={store.name} className="h-full w-full" />
              </Link>
              <div className="min-w-0 flex-1">
                <Link href={`/store/${store.id}`} className="truncate font-semibold text-ink hover:text-brand-600">
                  {store.name}
                </Link>
                <p className="flex items-center gap-2 text-sm text-ink-muted">
                  <Stars value={store.ratingAvg} />
                  <span>{store.productCount.toLocaleString()} products</span>
                </p>
              </div>
              <Button size="sm" variant="outline" disabled={busyId === store.id} onClick={() => unfollow(store.id)}>
                Unfollow
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
