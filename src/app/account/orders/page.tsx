"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge, EmptyState, Spinner } from "@/components/ui";
import { getBrowserApi } from "@/lib/api/bazar-api";
import { formatDate, formatMoney } from "@/lib/format";
import { orderStatusLabel, orderStatusTone, paymentMethodLabel } from "@/lib/labels";
import type { OrderDto } from "@/lib/types";

export default function OrdersPage() {
  const api = getBrowserApi();
  const [orders, setOrders] = useState<OrderDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    api
      .orders()
      .then((result) => active && setOrders(result.orders))
      .catch(() => active && setError("Could not load your orders."));
    return () => {
      active = false;
    };
  }, [api]);

  if (error) return <EmptyState title="Something went wrong" description={error} />;
  if (!orders) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="text-brand-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-bold text-ink">My orders</h1>
      {orders.length === 0 ? (
        <EmptyState
          title="No orders yet"
          description="When you place an order it will show up here."
          action={<Link href="/catalogue" className="text-sm font-semibold text-brand-600 hover:underline">Start shopping</Link>}
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                href={`/account/orders/${order.id}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-4 transition-colors hover:border-brand-300"
              >
                <div>
                  <p className="font-semibold text-ink">Order #{order.orderCode}</p>
                  <p className="text-sm text-ink-muted">
                    {formatDate(order.placedAt)} · {paymentMethodLabel(order.paymentMethod)}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <Badge tone={orderStatusTone(order.status)}>{orderStatusLabel(order.status)}</Badge>
                  <span className="font-bold text-ink">{formatMoney(order.total)}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
