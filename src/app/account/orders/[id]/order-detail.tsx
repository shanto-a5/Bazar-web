"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SafeImage } from "@/components/safe-image";
import { Alert, Badge, EmptyState, Spinner } from "@/components/ui";
import { getBrowserApi } from "@/lib/api/bazar-api";
import { formatDate, formatDateTime, formatMoney } from "@/lib/format";
import { orderStatusLabel, orderStatusTone, paymentMethodLabel, paymentStatusLabel } from "@/lib/labels";
import type { OrderDetailDto } from "@/lib/types";

export function OrderDetail({ id, placed }: { id: string; placed: boolean }) {
  const api = getBrowserApi();
  const [data, setData] = useState<OrderDetailDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    api
      .order(id)
      .then((result) => active && setData(result))
      .catch(() => active && setError("We could not find this order."));
    return () => {
      active = false;
    };
  }, [api, id]);

  if (error) return <EmptyState title="Order not found" description={error} action={<Link href="/account/orders" className="text-sm font-semibold text-brand-600 hover:underline">Back to orders</Link>} />;
  if (!data) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="text-brand-500" />
      </div>
    );
  }

  const { order, sellerOrders, payment } = data;

  return (
    <div className="flex flex-col gap-6">
      {placed && <Alert tone="success">Thank you! Your order was placed successfully.</Alert>}

      <div>
        <Link href="/account/orders" className="text-sm text-ink-muted hover:text-brand-600">← Back to orders</Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-ink">Order #{order.orderCode}</h1>
          <Badge tone={orderStatusTone(order.status)}>{orderStatusLabel(order.status)}</Badge>
        </div>
        <p className="text-sm text-ink-muted">Placed {formatDate(order.placedAt)}</p>
      </div>

      {sellerOrders.map((sellerOrder) => (
        <section key={sellerOrder.id} className="rounded-[var(--radius-card)] border border-line bg-surface p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Link href={`/store/${sellerOrder.storeId}`} className="font-semibold text-ink hover:text-brand-600">
              {sellerOrder.storeName}
            </Link>
            <Badge tone={orderStatusTone(sellerOrder.status)}>{orderStatusLabel(sellerOrder.status)}</Badge>
          </div>

          {(sellerOrder.carrier || sellerOrder.trackingNumber) && (
            <p className="mt-1 text-sm text-ink-muted">
              {sellerOrder.carrier && <>Carrier: {sellerOrder.carrier}. </>}
              {sellerOrder.trackingNumber && <>Tracking: {sellerOrder.trackingNumber}</>}
            </p>
          )}

          <ul className="mt-3 divide-y divide-line">
            {sellerOrder.items.map((item) => (
              <li key={item.id} className="flex gap-3 py-3">
                <Link href={`/product/${item.productId}`} className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-line bg-surface-muted">
                  <SafeImage src={item.image} alt={item.productName} className="h-full w-full" />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link href={`/product/${item.productId}`} className="line-clamp-1 text-sm font-medium text-ink hover:text-brand-600">
                    {item.productName}
                  </Link>
                  {item.variantAttributes && Object.keys(item.variantAttributes).length > 0 && (
                    <p className="text-xs text-ink-faint">
                      {Object.entries(item.variantAttributes).map(([key, value]) => `${key}: ${value}`).join(", ")}
                    </p>
                  )}
                  <p className="text-sm text-ink-muted">
                    {formatMoney(item.unitPrice)} × {item.quantity}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-semibold text-ink">{formatMoney(item.subtotal)}</span>
              </li>
            ))}
          </ul>

          {sellerOrder.timeline.length > 0 && (
            <ol className="mt-3 flex flex-col gap-1 border-t border-line pt-3 text-sm">
              {sellerOrder.timeline.map((event, index) => (
                <li key={index} className="flex items-center justify-between gap-3">
                  <span className="text-ink-muted">{orderStatusLabel(event.status)}</span>
                  <span className="text-xs text-ink-faint">{formatDateTime(event.at)}</span>
                </li>
              ))}
            </ol>
          )}

          <dl className="mt-3 space-y-1 border-t border-line pt-3 text-sm">
            <Row label="Subtotal" value={formatMoney(sellerOrder.subtotal)} />
            <Row label="Shipping" value={formatMoney(sellerOrder.shippingFee)} />
            {sellerOrder.vouchersDiscount > 0 && <Row label="Discount" value={`− ${formatMoney(sellerOrder.vouchersDiscount)}`} />}
            <Row label="Total" value={formatMoney(sellerOrder.total)} strong />
          </dl>
        </section>
      ))}

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-[var(--radius-card)] border border-line bg-surface p-4">
          <h2 className="font-semibold text-ink">Delivery address</h2>
          {order.shippingAddress ? (
            <address className="mt-2 text-sm not-italic text-ink-muted">
              <p className="font-medium text-ink">{order.shippingAddress.recipientName}</p>
              <p>{order.shippingAddress.phone}</p>
              <p>{[order.shippingAddress.addressLine, order.shippingAddress.area, order.shippingAddress.district, order.shippingAddress.division, order.shippingAddress.postalCode].filter(Boolean).join(", ")}</p>
            </address>
          ) : (
            <p className="mt-2 text-sm text-ink-muted">No address on file.</p>
          )}
        </div>
        <div className="rounded-[var(--radius-card)] border border-line bg-surface p-4">
          <h2 className="font-semibold text-ink">Payment</h2>
          <dl className="mt-2 space-y-1 text-sm">
            <Row label="Method" value={paymentMethodLabel(order.paymentMethod)} />
            <Row label="Status" value={paymentStatusLabel(order.paymentStatus)} />
            <Row label="Total" value={formatMoney(order.total)} strong />
          </dl>
          {payment.length > 0 && payment[0].reference && (
            <p className="mt-1 text-xs text-ink-faint">Reference: {payment[0].reference}</p>
          )}
        </div>
      </section>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-ink-muted">{label}</dt>
      <dd className={strong ? "font-bold text-ink" : "font-medium text-ink"}>{value}</dd>
    </div>
  );
}
