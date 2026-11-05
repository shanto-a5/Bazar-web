"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ProductGrid } from "@/components/product-card";
import { useSession } from "@/components/session-provider";
import { getBrowserApi } from "@/lib/api/bazar-api";
import type { WishlistItemDto } from "@/lib/types";

export default function AccountOverviewPage() {
  const api = getBrowserApi();
  const { user } = useSession();
  const [counts, setCounts] = useState({ orders: 0, wishlist: 0, addresses: 0, unread: 0 });
  const [recent, setRecentlyViewed] = useState<WishlistItemDto[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const [orders, wishlist, addresses, notifications, recent] = await Promise.allSettled([
        api.orders(),
        api.wishlist(),
        api.addresses(),
        api.unreadNotificationCount(),
        api.recentlyViewed(8),
      ]);
      if (!active) return;
      setReady(true);
      setCounts({
        orders: orders.status === "fulfilled" ? orders.value.orders.length : 0,
        wishlist: wishlist.status === "fulfilled" ? wishlist.value.items.length : 0,
        addresses: addresses.status === "fulfilled" ? addresses.value.addresses.length : 0,
        unread: notifications.status === "fulfilled" ? notifications.value.unreadCount : 0,
      });
      if (recent.status === "fulfilled") setRecentlyViewed(recent.value.items);
    })();
    return () => {
      active = false;
    };
  }, [api]);

  useEffect(() => {
    const sync = (event: Event) => {
      const detail = (event as CustomEvent<{ unreadCount: number }>).detail;
      if (typeof detail?.unreadCount === "number") setCounts((current) => ({ ...current, unread: detail.unreadCount }));
    };
    window.addEventListener("bazar:notification-sync", sync);
    return () => window.removeEventListener("bazar:notification-sync", sync);
  }, []);

  const recentProducts = recent.map((item) => item.product).filter(Boolean);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Hello{user ? `, ${user.name.split(" ")[0]}` : ""}</h1>
        <p className="text-sm text-ink-muted">Manage your orders, saved items and account details.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard href="/account/orders" label="Orders" value={counts.orders} ready={ready} />
        <StatCard href="/account/wishlist" label="Wishlist" value={counts.wishlist} ready={ready} />
        <StatCard href="/account/addresses" label="Addresses" value={counts.addresses} ready={ready} />
        <StatCard href="/account/notifications" label="Unread" value={counts.unread} ready={ready} />
      </div>

      {recentProducts.length > 0 && (
        <section>
          <h2 className="mb-3 font-bold text-ink">Recently viewed</h2>
          <ProductGrid products={recentProducts} />
        </section>
      )}
    </div>
  );
}

function StatCard({ href, label, value, ready }: { href: string; label: string; value: number; ready: boolean }) {
  return (
    <Link href={href} className="rounded-[var(--radius-card)] border border-line bg-surface p-4 transition-colors hover:border-brand-300">
      <p className="text-2xl font-extrabold text-brand-600">{ready ? value.toLocaleString() : "—"}</p>
      <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">{label}</p>
    </Link>
  );
}
