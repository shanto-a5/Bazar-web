"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SafeImage } from "@/components/safe-image";
import { Alert, Badge, Button, EmptyState, Input, Spinner } from "@/components/ui";
import { getBrowserApi } from "@/lib/api/bazar-api";
import { ApiError } from "@/lib/api/client";
import { formatMoney } from "@/lib/format";
import type { DeliveryMethodId, PricedCart } from "@/lib/types";

export function CartView() {
  const router = useRouter();
  const api = getBrowserApi();

  const [cart, setCart] = useState<PricedCart | null>(null);
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethodId>("standard");
  const [voucherInput, setVoucherInput] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .cart(deliveryMethod, appliedVoucher)
      .then((next) => {
        if (cancelled) return;
        setCart(next);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : "Could not load your cart.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [api, deliveryMethod, appliedVoucher]);

  async function mutate(action: () => Promise<PricedCart>, fallback: string) {
    setBusy(true);
    setError(null);
    try {
      setCart(await action());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : fallback);
    } finally {
      setBusy(false);
    }
  }

  if (loading && !cart) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="text-brand-500" />
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <EmptyState
        title="Your cart is empty"
        description="Add products to your cart to check out."
        action={
          <Link href="/catalogue" className="text-sm font-semibold text-brand-600 hover:underline">
            Start shopping
          </Link>
        }
      />
    );
  }

  const selectedCount = cart.items.filter((line) => line.selected).length;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
      <div className="flex flex-col gap-5">
        {error && <Alert>{error}</Alert>}
        {cart.issues.length > 0 && (
          <Alert tone="info">
            <p className="font-semibold">Some items need your attention</p>
            <ul className="mt-1 list-disc pl-4">
              {cart.issues.map((issue) => (
                <li key={`${issue.itemId}-${issue.kind}`}>{issue.productName}: {issue.message}</li>
              ))}
            </ul>
          </Alert>
        )}

        {cart.groups.map((group) => {
          const allSelected = group.items.every((line) => line.selected);
          return (
            <div key={group.sellerId} className="overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface">
              <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
                <Link href={`/store/${group.storeId}`} className="font-semibold text-ink hover:text-brand-600">
                  {group.storeName}
                </Link>
                <button
                  type="button"
                  className="text-sm font-medium text-brand-600 hover:underline disabled:opacity-50"
                  disabled={busy}
                  onClick={() => mutate(() => api.selectCartLines({ selected: !allSelected, sellerId: group.sellerId }), "Could not update selection.")}
                >
                  {allSelected ? "Deselect all" : "Select all"}
                </button>
              </div>
              <ul className="divide-y divide-line">
                {group.items.map((line) => (
                  <li key={line.id} className="flex gap-3 p-4">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 shrink-0"
                      checked={line.selected}
                      disabled={busy}
                      onChange={() => mutate(() => api.patchCartItem(line.id, { selected: !line.selected }), "Could not update item.")}
                      aria-label={`Select ${line.name}`}
                    />
                    <Link href={`/product/${line.productId}`} className="h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-line bg-surface-muted">
                      <SafeImage src={line.image} alt={line.name} className="h-full w-full" />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link href={`/product/${line.productId}`} className="line-clamp-2 text-sm font-medium text-ink hover:text-brand-600">
                        {line.name}
                      </Link>
                      {line.variantAttributes && Object.keys(line.variantAttributes).length > 0 && (
                        <p className="mt-0.5 text-xs text-ink-faint">
                          {Object.entries(line.variantAttributes).map(([key, value]) => `${key}: ${value}`).join(", ")}
                        </p>
                      )}
                      <p className="mt-1 text-sm font-semibold text-brand-600">{formatMoney(line.unitPrice)}</p>
                      {!line.available && (
                        <p className="mt-1 text-xs font-medium text-danger">{line.unavailableReason ?? "Unavailable"}</p>
                      )}
                      {line.priceChanged && <Badge tone="accent">Price updated</Badge>}
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
                        <div className="inline-flex items-center rounded-lg border border-line">
                          <button type="button" className="h-8 w-8 text-lg text-ink-muted disabled:opacity-40" onClick={() => mutate(() => api.patchCartItem(line.id, { quantity: line.quantity - 1 }), "Could not update quantity.")} disabled={busy || line.quantity <= 1} aria-label="Decrease quantity">−</button>
                          <span className="w-9 text-center text-sm">{line.quantity}</span>
                          <button type="button" className="h-8 w-8 text-lg text-ink-muted disabled:opacity-40" onClick={() => mutate(() => api.patchCartItem(line.id, { quantity: line.quantity + 1 }), "Could not update quantity.")} disabled={busy} aria-label="Increase quantity">+</button>
                        </div>
                        <button type="button" className="text-sm font-medium text-ink-muted hover:text-danger" onClick={() => mutate(() => api.removeCartItem(line.id), "Could not remove item.")} disabled={busy}>
                          Remove
                        </button>
                      </div>
                    </div>
                    <div className="hidden shrink-0 text-right sm:block">
                      <p className="text-sm font-semibold text-ink">{formatMoney(line.subtotal)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-[var(--radius-card)] border border-line bg-surface p-5">
          <h2 className="text-lg font-bold text-ink">Order summary</h2>

          <div className="mt-4">
            <p className="mb-2 text-sm font-semibold text-ink">Delivery</p>
            <div className="flex flex-col gap-2">
              {(["standard", "express"] as DeliveryMethodId[]).map((method) => (
                <label key={method} className="flex cursor-pointer items-start gap-2 rounded-lg border border-line p-3 text-sm has-[:checked]:border-brand-400">
                  <input
                    type="radio"
                    name="delivery"
                    className="mt-0.5"
                    checked={deliveryMethod === method}
                    onChange={() => setDeliveryMethod(method)}
                  />
                  <span>
                    <span className="font-medium text-ink capitalize">{method}</span>
                    <span className="block text-xs text-ink-muted">
                      {method === "express" ? "Priority handling, 1–2 days" : "Store dispatch with tracking, 2–5 days"}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <form onSubmit={(event) => { event.preventDefault(); setAppliedVoucher(voucherInput.trim() || undefined); }} className="mt-4">
            <p className="mb-2 text-sm font-semibold text-ink">Voucher</p>
            <div className="flex gap-2">
              <Input value={voucherInput} onChange={(event) => setVoucherInput(event.target.value)} placeholder="Enter code" />
              <Button type="submit" variant="outline" disabled={busy}>Apply</Button>
            </div>
          </form>

          <dl className="mt-5 space-y-2 text-sm">
            <Row label={`Items (${selectedCount} selected)`} value={String(cart.itemCount)} />
            <Row label="Subtotal" value={formatMoney(cart.subtotal)} />
            <Row label="Shipping" value={formatMoney(cart.shippingTotal)} />
            {cart.voucherDiscount > 0 && <Row label="Voucher discount" value={`− ${formatMoney(cart.voucherDiscount)}`} tone="success" />}
            <div className="border-t border-line pt-2">
              <Row label="Total" value={formatMoney(cart.grandTotal)} strong />
            </div>
          </dl>

          <Button
            size="lg"
            fullWidth
            className="mt-5"
            disabled={busy || selectedCount === 0}
            onClick={() => router.push("/checkout")}
          >
            Proceed to checkout
          </Button>
          <Link href="/catalogue" className="mt-3 block text-center text-sm font-medium text-brand-600 hover:underline">
            Continue shopping
          </Link>
        </div>
      </aside>
    </div>
  );
}

function Row({ label, value, strong, tone }: { label: string; value: string; strong?: boolean; tone?: "success" }) {
  return (
    <div className="flex items-center justify-between">
      <dt className={strong ? "font-semibold text-ink" : "text-ink-muted"}>{label}</dt>
      <dd className={strong ? "font-bold text-ink" : tone === "success" ? "font-medium text-success" : "font-medium text-ink"}>
        {value}
      </dd>
    </div>
  );
}
