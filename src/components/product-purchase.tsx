"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Badge, Button, cn } from "@/components/ui";
import { useQuickAccount } from "@/components/quick-account";
import { useSession } from "@/components/session-provider";
import { getBrowserApi } from "@/lib/api/bazar-api";
import { ApiError } from "@/lib/api/client";
import { effectivePrice, formatMoney } from "@/lib/format";
import type { Product, ProductVariant } from "@/lib/types";

export function ProductPurchase({
  product,
  availableStock,
}: {
  product: Product;
  availableStock: number;
}) {
  const router = useRouter();
  const { status, user } = useSession();
  const { present } = useQuickAccount();
  const api = getBrowserApi();

  const attributeNames = useMemo(() => {
    if (!product.hasVariants) return [];
    const names = new Set<string>();
    for (const variant of product.variants) {
      for (const key of Object.keys(variant.attributes ?? {})) names.add(key);
    }
    return [...names];
  }, [product]);

  const [selection, setSelection] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const selectedVariant: ProductVariant | undefined = useMemo(() => {
    if (!product.hasVariants) return undefined;
    const complete = attributeNames.every((name) => selection[name]);
    if (!complete) return undefined;
    return product.variants.find((variant) =>
      attributeNames.every((name) => variant.attributes?.[name] === selection[name]),
    );
  }, [attributeNames, product, selection]);

  const variantReady = !product.hasVariants || Boolean(selectedVariant);
  const unitPrice = selectedVariant?.price && selectedVariant.price > 0
    ? selectedVariant.price
    : effectivePrice(product);
  const variantStock = selectedVariant ? selectedVariant.stock : availableStock;
  const maxQuantity = Math.max(1, variantStock);
  const outOfStock = variantStock <= 0;
  const isSaved = status === "authenticated" && saved;

  useEffect(() => {
    if (status !== "authenticated") return;
    let active = true;
    api
      .wishlist()
      .then(({ items }) => {
        if (active) setSaved(items.some((item) => item.productId === product.id));
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [api, product.id, status]);

  function requireAuth(): boolean {
    if (status === "authenticated") return true;
    router.push(`/login?next=${encodeURIComponent(`/product/${product.id}`)}`);
    return false;
  }

  /**
   * Adds the selected line to the cart and, if asked, continues to checkout.
   * Runs after the session exists (immediately for a signed-in shopper, or as
   * the deferred continuation of the phone-only prompt for a guest).
   */
  async function commitPurchase(goToCheckout: boolean) {
    setBusy(true);
    try {
      await api.addCartItem({
        productId: product.id,
        quantity,
        variantId: selectedVariant?.id,
      });
      if (goToCheckout) router.push("/checkout");
      else setNotice("Added to cart.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not add to cart.");
    } finally {
      setBusy(false);
    }
  }

  /**
   * The purchase action. A signed-in shopper goes straight through; a guest
   * gets the phone-only prompt instead of a sign-in wall, and the same purchase
   * resumes once the session exists. The selected variant and quantity are held
   * in component state, so they survive the prompt.
   */
  function purchase(goToCheckout: boolean) {
    setError(null);
    setNotice(null);
    if (product.hasVariants && !selectedVariant) {
      setError("Please choose all options first.");
      return;
    }
    if (status === "loading") return;
    if (status === "authenticated") {
      void commitPurchase(goToCheckout);
      return;
    }
    present({ onAuthenticated: () => void commitPurchase(goToCheckout) });
  }

  async function toggleWishlist() {
    if (!requireAuth()) return;
    setBusy(true);
    setError(null);
    try {
      if (saved) await api.removeWishlistItem(product.id);
      else await api.addWishlistItem(product.id);
      setSaved(!saved);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update wishlist.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {attributeNames.map((name) => (
        <div key={name}>
          <p className="mb-2 text-sm font-semibold text-ink">
            {name}: <span className="font-normal text-ink-muted">{selection[name] ?? "Choose"}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {[...new Set(product.variants.map((v) => v.attributes?.[name]).filter(Boolean))].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setSelection((prev) => ({ ...prev, [name]: value as string }))}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-sm",
                  selection[name] === value
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-line bg-surface text-ink hover:border-brand-300",
                )}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
      ))}

      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-ink">Price</span>
        <span className="text-2xl font-extrabold text-brand-600">{formatMoney(unitPrice)}</span>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-ink">Quantity</span>
        <div className="inline-flex items-center rounded-full border border-line">
          <button
            type="button"
            className="grid h-9 w-9 place-items-center text-lg text-ink-muted disabled:opacity-40"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1}
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span className="w-10 text-center text-sm font-semibold">{quantity}</span>
          <button
            type="button"
            className="grid h-9 w-9 place-items-center text-lg text-ink-muted disabled:opacity-40"
            onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
            disabled={quantity >= maxQuantity}
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
        {!outOfStock && variantStock <= (product.lowStockThreshold || 5) && (
          <Badge tone="accent">Only {variantStock} left</Badge>
        )}
      </div>

      {error && <Alert>{error}</Alert>}
      {notice && <Alert tone="success">{notice}</Alert>}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          size="lg"
          fullWidth
          disabled={busy || outOfStock || !variantReady || status === "loading"}
          onClick={() => purchase(false)}
        >
          {busy ? "Adding…" : "Add to cart"}
        </Button>
        <Button
          size="lg"
          fullWidth
          variant="outline"
          disabled={busy || outOfStock || !variantReady || status === "loading"}
          onClick={() => purchase(true)}
        >
          Buy now
        </Button>
      </div>

      <Button variant="ghost" onClick={toggleWishlist} disabled={busy} className="self-start">
        {isSaved ? "♥ Saved to wishlist" : "♡ Save to wishlist"}
      </Button>

      {user && !user.hasPassword && (
        <Alert tone="info">
          You are signed in with a quick account. Set a password in{" "}
          <a href="/account" className="underline">your account</a> to secure it.
        </Alert>
      )}
    </div>
  );
}
