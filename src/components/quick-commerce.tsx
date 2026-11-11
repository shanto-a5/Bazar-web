"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useArea } from "@/components/area-provider";
import { useLanguage } from "@/components/language-provider";
import { useQuickAccount } from "@/components/quick-account";
import { SafeImage } from "@/components/safe-image";
import { useSession } from "@/components/session-provider";
import { getBrowserApi } from "@/lib/api/bazar-api";
import { discountPercent, effectivePrice, formatMoney } from "@/lib/format";
import type { AddressDto, AddressInput, PricedCartLine, Product } from "@/lib/types";

const GUEST_CART_KEY = "bazar.guest_cart.v1";
const SUCCESS_DURATION_MS = 1000;

interface GuestCartLine {
  id: string;
  productId: string;
  name: string;
  image?: string;
  unitPrice: number;
  quantity: number;
  variantId?: string;
}

interface MiniCartDisplayLine {
  id: string;
  productId: string;
  name: string;
  image?: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  variantId?: string;
}

function readGuestCart(): GuestCartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(GUEST_CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeGuestCart(lines: GuestCartLine[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(GUEST_CART_KEY, JSON.stringify(lines));
  } catch {
    /* ignore storage errors */
  }
}

function resolveUnitWeightLabel(product: Product, fallback: string): string {
  if (product.variants && product.variants.length > 0) {
    const first = product.variants[0];
    const attrs = Object.values(first.attributes ?? {}).filter(Boolean);
    if (attrs.length > 0) return attrs.join(" · ");
    if (first.sku) return first.sku;
  }
  const match = product.name.match(/(\d+(?:\.\d+)?\s*(?:kg|g|gm|ml|l|ltr|pc|pcs|কেজি|গ্রাম|লিটার|পিস))/i);
  if (match) return match[1];
  return fallback;
}

function buildOrderAddress(params: {
  cached?: AddressDto | null;
  areaName?: string;
  userName?: string;
  phone?: string;
}): AddressInput {
  const activeArea = (params.areaName ?? "").trim() || "Bangladesh";
  const rawRecipient = (params.cached?.recipientName || params.userName || params.phone || "Customer").trim();
  const recipientName = rawRecipient.length >= 2 ? rawRecipient : "Customer";
  const rawPhone = (params.cached?.phone || params.phone || "01700000000").trim();
  const phone = rawPhone.length >= 6 ? rawPhone : "01700000000";
  const rawDivision = (params.cached?.division || activeArea || "Bangladesh").trim();
  const division = rawDivision.length >= 2 ? rawDivision : "Bangladesh";
  const rawDistrict = (params.cached?.district || activeArea || "Bangladesh").trim();
  const district = rawDistrict.length >= 2 ? rawDistrict : "Bangladesh";
  const area = (params.cached?.area || activeArea).trim();

  const latitude = params.cached?.latitude;
  const longitude = params.cached?.longitude;
  const hasCoords =
    typeof latitude === "number" &&
    typeof longitude === "number" &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude);

  let addressLine = (params.cached?.addressLine || "").trim();
  if (addressLine.length < 4) {
    addressLine = hasCoords
      ? `GPS ${latitude.toFixed(5)}, ${longitude.toFixed(5)} (${activeArea})`
      : `${activeArea} Village Delivery`;
  }

  return {
    label: params.cached?.label || "1-Click Delivery",
    recipientName,
    phone,
    division,
    district,
    area,
    addressLine,
    postalCode: params.cached?.postalCode || "",
    isDefault: true,
    ...(hasCoords ? { latitude, longitude } : {}),
  };
}

interface QuickCommerceContextValue {
  cartCount: number;
  cartBouncing: boolean;
  openQuickView: (product: Product) => void;
  closeQuickView: () => void;
  openMiniCart: () => void;
  closeMiniCart: () => void;
  addProductToCart: (product: Product) => Promise<void>;
  buyNowProduct: (product: Product) => void;
  buyNowMiniCart: () => void;
}

const QuickCommerceContext = createContext<QuickCommerceContextValue | null>(null);

export function useQuickCommerce(): QuickCommerceContextValue {
  const ctx = useContext(QuickCommerceContext);
  if (!ctx) throw new Error("useQuickCommerce must be used within QuickCommerceProvider");
  return ctx;
}

type PendingOrderTarget =
  | { kind: "product"; product: Product }
  | { kind: "cart"; guestSnapshot: GuestCartLine[] };

export function QuickCommerceProvider({ children }: { children: ReactNode }) {
  const api = getBrowserApi();
  const router = useRouter();
  const pathname = usePathname();
  const { status, user } = useSession();
  const { present: presentQuickAccount } = useQuickAccount();
  const { area } = useArea();
  const { t } = useLanguage();

  const authenticated = status === "authenticated" && Boolean(user);
  const userRef = useRef(user);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [miniCartOpen, setMiniCartOpen] = useState(false);

  const [remoteLines, setRemoteLines] = useState<PricedCartLine[]>([]);
  const [guestLines, setGuestLines] = useState<GuestCartLine[]>(() => readGuestCart());
  const [cartBouncing, setCartBouncing] = useState(false);
  const [justAddedId, setJustAddedId] = useState<string | null>(null);

  const [placingOrder, setPlacingOrder] = useState(false);
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [orderSuccessVisible, setOrderSuccessVisible] = useState(false);

  const orderLoadingSteps = useMemo(
    () => [
      t("orderStepVerifyPhone"),
      t("orderStepConfirmLocation"),
      t("orderStepCalculateTotal"),
      t("orderStepPrepareOrder"),
    ],
    [t],
  );

  useEffect(() => {
    if (!placingOrder) return;
    const interval = setInterval(() => {
      setLoadingStepIndex((prev) => (prev < 3 ? prev + 1 : prev));
    }, 600);
    return () => clearInterval(interval);
  }, [placingOrder]);

  // Track whether we pushed a dummy history entry for back-button hijacking
  const historyPushedRef = useRef(false);
  const closingFromPopStateRef = useRef(false);

  const triggerBounce = useCallback(() => {
    setCartBouncing(false);
    setTimeout(() => setCartBouncing(true), 10);
    setTimeout(() => setCartBouncing(false), 500);
  }, []);

  const refreshRemoteCart = useCallback(
    async (force = false) => {
      if (!authenticated && !force) return;
      try {
        const cart = await api.cart();
        const allLines = (cart.groups ?? []).flatMap((g) => g.items);
        setRemoteLines(allLines);
      } catch {
        /* ignore transient fetch failure */
      }
    },
    [api, authenticated],
  );

  useEffect(() => {
    if (!authenticated) return;
    let active = true;
    api
      .cart()
      .then((cart) => {
        if (active) {
          setRemoteLines((cart.groups ?? []).flatMap((g) => g.items));
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [api, authenticated]);

  // STEP 3.2: Browser History Back-Button Hijacking (`window.history.pushState` + `popstate`)
  const pushModalHistory = useCallback(() => {
    if (typeof window === "undefined") return;
    if (!historyPushedRef.current) {
      window.history.pushState({ bazarQuickModal: true }, "");
      historyPushedRef.current = true;
    }
  }, []);

  const popModalHistoryIfNeeded = useCallback(() => {
    if (typeof window === "undefined") return;
    if (historyPushedRef.current && !closingFromPopStateRef.current) {
      historyPushedRef.current = false;
      window.history.back();
    } else {
      historyPushedRef.current = false;
    }
  }, []);

  useEffect(() => {
    const onPopState = () => {
      if (quickViewProduct || miniCartOpen) {
        closingFromPopStateRef.current = true;
        historyPushedRef.current = false;
        setQuickViewProduct(null);
        setMiniCartOpen(false);
        setOrderError(null);
        closingFromPopStateRef.current = false;
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [quickViewProduct, miniCartOpen]);

  const openQuickView = useCallback(
    (product: Product) => {
      setOrderError(null);
      setMiniCartOpen(false);
      setQuickViewProduct(product);
      pushModalHistory();
    },
    [pushModalHistory],
  );

  const closeQuickView = useCallback(() => {
    setQuickViewProduct(null);
    setOrderError(null);
    popModalHistoryIfNeeded();
  }, [popModalHistoryIfNeeded]);

  const openMiniCart = useCallback(() => {
    setOrderError(null);
    setQuickViewProduct(null);
    setMiniCartOpen(true);
    if (authenticated) {
      void refreshRemoteCart();
    } else {
      setGuestLines(readGuestCart());
    }
    pushModalHistory();
  }, [authenticated, refreshRemoteCart, pushModalHistory]);

  const closeMiniCart = useCallback(() => {
    setMiniCartOpen(false);
    setOrderError(null);
    popModalHistoryIfNeeded();
  }, [popModalHistoryIfNeeded]);

  const addProductToCart = useCallback(
    async (product: Product) => {
      setOrderError(null);
      const variantId = product.hasVariants && product.variants?.length ? product.variants[0].id : undefined;
      triggerBounce();
      setJustAddedId(product.id);
      setTimeout(() => {
        setJustAddedId((curr) => (curr === product.id ? null : curr));
      }, 900);

      if (authenticated) {
        try {
          const updated = await api.addCartItem({ productId: product.id, quantity: 1, variantId });
          setRemoteLines((updated.groups ?? []).flatMap((g) => g.items));
        } catch (err) {
          setOrderError(err instanceof Error ? err.message : "Could not add to cart");
        }
      } else {
        const current = readGuestCart();
        const existing = current.find(
          (line) => line.productId === product.id && (line.variantId ?? undefined) === (variantId ?? undefined),
        );
        const price = effectivePrice(product);
        if (existing) {
          existing.quantity += 1;
        } else {
          current.push({
            id: `guest_${product.id}_${variantId ?? "base"}`,
            productId: product.id,
            name: product.name,
            image: product.images?.[0],
            unitPrice: price,
            quantity: 1,
            variantId,
          });
        }
        writeGuestCart(current);
        setGuestLines([...current]);
      }
    },
    [api, authenticated, triggerBounce],
  );

  const updateLineQuantity = useCallback(
    async (line: MiniCartDisplayLine, nextQty: number) => {
      if (authenticated) {
        try {
          const updated =
            nextQty <= 0 ? await api.removeCartItem(line.id) : await api.patchCartItem(line.id, { quantity: nextQty });
          setRemoteLines((updated.groups ?? []).flatMap((g) => g.items));
        } catch {
          /* ignore */
        }
      } else {
        const current = readGuestCart();
        const next =
          nextQty <= 0
            ? current.filter((item) => item.id !== line.id)
            : current.map((item) => (item.id === line.id ? { ...item, quantity: nextQty } : item));
        writeGuestCart(next);
        setGuestLines(next);
      }
    },
    [api, authenticated],
  );

  const triggerOrderSuccess = useCallback(() => {
    setPlacingOrder(false);
    setQuickViewProduct(null);
    setMiniCartOpen(false);
    setOrderError(null);
    historyPushedRef.current = false;
    setOrderSuccessVisible(true);

    setTimeout(() => {
      setOrderSuccessVisible(false);
      if (pathname !== "/") {
        router.push("/");
      }
    }, SUCCESS_DURATION_MS);
  }, [pathname, router]);

  const executeOneClickOrder = useCallback(
    async (params: {
      target: PendingOrderTarget;
      userName?: string;
      phone?: string;
    }) => {
      setLoadingStepIndex(0);
      setPlacingOrder(true);
      setOrderError(null);
      try {
        if (params.target.kind === "product") {
          const p = params.target.product;
          const variantId = p.hasVariants && p.variants?.length ? p.variants[0].id : undefined;
          await api.addCartItem({ productId: p.id, quantity: 1, variantId });
        } else if (params.target.guestSnapshot.length > 0) {
          for (const item of params.target.guestSnapshot) {
            await api.addCartItem({
              productId: item.productId,
              quantity: item.quantity,
              variantId: item.variantId,
            });
          }
          writeGuestCart([]);
          setGuestLines([]);
        }

        let defaultAddress: AddressDto | null = null;
        try {
          const { addresses } = await api.addresses();
          defaultAddress = addresses.find((a) => a.isDefault) ?? addresses[0] ?? null;
        } catch {
          defaultAddress = null;
        }

        const orderAddress = buildOrderAddress({
          cached: defaultAddress,
          areaName: area?.name,
          userName: params.userName ?? userRef.current?.name,
          phone: params.phone ?? userRef.current?.phone,
        });

        await api.createOrder({
          address: orderAddress,
          paymentMethod: "cod",
        });

        await refreshRemoteCart(true);
        triggerOrderSuccess();
      } catch (err) {
        setPlacingOrder(false);
        setOrderError(err instanceof Error ? err.message : "Could not place order.");
      }
    },
    [api, area, refreshRemoteCart, triggerOrderSuccess],
  );

  const promptGuestQuickAccount = useCallback(
    (target: PendingOrderTarget) => {
      setOrderError(null);
      presentQuickAccount({
        onAuthenticated: () => {
          void (async () => {
            let activeUser = userRef.current;
            if (!activeUser) {
              try {
                activeUser = await api.me();
              } catch {
                activeUser = null;
              }
            }
            await executeOneClickOrder({
              target,
              userName: activeUser?.name,
              phone: activeUser?.phone,
            });
          })();
        },
      });
    },
    [api, presentQuickAccount, executeOneClickOrder],
  );

  const buyNowProduct = useCallback(
    (product: Product) => {
      const target: PendingOrderTarget = { kind: "product", product };
      if (authenticated && user) {
        void executeOneClickOrder({
          target,
          userName: user.name,
          phone: user.phone,
        });
      } else {
        promptGuestQuickAccount(target);
      }
    },
    [authenticated, user, executeOneClickOrder, promptGuestQuickAccount],
  );

  const buyNowMiniCart = useCallback(() => {
    const target: PendingOrderTarget = {
      kind: "cart",
      guestSnapshot: authenticated ? [] : readGuestCart(),
    };
    if (authenticated && user) {
      void executeOneClickOrder({
        target,
        userName: user.name,
        phone: user.phone,
      });
    } else {
      promptGuestQuickAccount(target);
    }
  }, [authenticated, user, executeOneClickOrder, promptGuestQuickAccount]);

  const displayLines: MiniCartDisplayLine[] = useMemo(() => {
    if (authenticated) {
      return remoteLines.map((line) => ({
        id: line.id,
        productId: line.productId,
        name: line.name,
        image: line.image,
        unitPrice: line.unitPrice,
        quantity: line.quantity,
        subtotal: line.subtotal,
        variantId: line.variantId,
      }));
    }
    return guestLines.map((line) => ({
      id: line.id,
      productId: line.productId,
      name: line.name,
      image: line.image,
      unitPrice: line.unitPrice,
      quantity: line.quantity,
      subtotal: line.unitPrice * line.quantity,
      variantId: line.variantId,
    }));
  }, [authenticated, remoteLines, guestLines]);

  const cartCount = useMemo(
    () => displayLines.reduce((sum, item) => sum + item.quantity, 0),
    [displayLines],
  );

  const miniCartSubtotal = useMemo(
    () => displayLines.reduce((sum, item) => sum + item.subtotal, 0),
    [displayLines],
  );

  const value = useMemo<QuickCommerceContextValue>(
    () => ({
      cartCount,
      cartBouncing,
      openQuickView,
      closeQuickView,
      openMiniCart,
      closeMiniCart,
      addProductToCart,
      buyNowProduct,
      buyNowMiniCart,
    }),
    [
      cartCount,
      cartBouncing,
      openQuickView,
      closeQuickView,
      openMiniCart,
      closeMiniCart,
      addProductToCart,
      buyNowProduct,
      buyNowMiniCart,
    ],
  );

  return (
    <QuickCommerceContext.Provider value={value}>
      {children}

      {/* STEP 3: Snappy Top-Left Quick View Popup (~80% screen) */}
      {quickViewProduct && (
        <div
          className="fixed inset-0 z-50 bg-black/55 backdrop-blur-[2px]"
          onClick={closeQuickView}
          role="dialog"
          aria-modal="true"
          aria-label={quickViewProduct.name}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="fixed left-3 top-3 z-50 flex max-h-[82vh] w-[84vw] max-w-xl origin-top-left flex-col overflow-hidden rounded-3xl border border-line bg-surface shadow-2xl transition-all duration-150 sm:left-5 sm:top-5"
          >
            <div className="relative h-56 w-full shrink-0 bg-surface-muted sm:h-64">
              <SafeImage
                src={quickViewProduct.images?.[0]}
                alt={quickViewProduct.name}
                className="h-full w-full object-cover"
              />
              {discountPercent(quickViewProduct.regularPrice, quickViewProduct.salePrice) > 0 && (
                <span className="absolute left-3 top-3 rounded-full bg-brand-500 px-3 py-1 text-xs font-extrabold text-white shadow">
                  -{discountPercent(quickViewProduct.regularPrice, quickViewProduct.salePrice)}%
                </span>
              )}
              <button
                type="button"
                onClick={closeQuickView}
                aria-label={t("close")}
                className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-black/65 text-sm font-bold text-white hover:bg-black/80"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto p-5">
              {/* Priority 1: Exceptionally large Price font */}
              <div className="flex flex-wrap items-baseline gap-3">
                <span className="text-3xl font-black tracking-tight text-brand-600 sm:text-4xl">
                  {formatMoney(effectivePrice(quickViewProduct))}
                </span>
                {quickViewProduct.salePrice && quickViewProduct.salePrice < quickViewProduct.regularPrice && (
                  <span className="text-base font-semibold text-ink-faint line-through">
                    {formatMoney(quickViewProduct.regularPrice)}
                  </span>
                )}
              </div>

              {/* Priority 2: Product Name */}
              <h2 className="text-lg font-extrabold leading-snug text-ink sm:text-xl">
                {quickViewProduct.name}
              </h2>

              {/* Priority 3: Unit / Weight (e.g., per-kg price) */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700">
                  ⚖️ {t("unitWeightLabel")}: {resolveUnitWeightLabel(quickViewProduct, t("defaultUnitWeight"))}
                </span>
                <span className="text-xs font-semibold text-ink-muted">
                  {formatMoney(effectivePrice(quickViewProduct))} ({t("perUnitPrice")})
                </span>
              </div>

              {orderError && <p className="text-xs font-semibold text-danger">{orderError}</p>}
            </div>

            {/* Bottom-Right Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 border-t border-line bg-surface-muted px-4 py-3.5">
              <button
                type="button"
                disabled={placingOrder}
                onClick={() => void addProductToCart(quickViewProduct)}
                className="flex-1 rounded-2xl border border-emerald-700 bg-emerald-600 px-4 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50 sm:flex-none sm:px-6"
              >
                {justAddedId === quickViewProduct.id ? t("addedToCart") : `🛒 ${t("addToCart")}`}
              </button>
              <button
                type="button"
                disabled={placingOrder}
                onClick={() => buyNowProduct(quickViewProduct)}
                className="rounded-2xl bg-brand-500 px-5 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-brand-600 disabled:opacity-50 sm:px-6"
              >
                ⚡ {t("buyNow")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4.1: Mini-Cart Popup */}
      {miniCartOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px]"
          onClick={closeMiniCart}
          role="dialog"
          aria-modal="true"
          aria-label={t("yourCart")}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="fixed right-3 top-16 z-50 flex max-h-[80vh] w-[92vw] max-w-md flex-col overflow-hidden rounded-3xl border border-line bg-surface p-5 shadow-2xl sm:right-6"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-ink">🛍️ {t("yourCart")}</h2>
              <button
                type="button"
                onClick={closeMiniCart}
                aria-label={t("close")}
                className="grid h-8 w-8 place-items-center rounded-full bg-surface-muted text-sm font-bold text-ink-muted hover:bg-line"
              >
                ✕
              </button>
            </div>

            {displayLines.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-base font-bold text-ink">{t("cartEmptyTitle")}</p>
                <p className="mt-1 text-xs text-ink-muted">{t("cartEmptyCaption")}</p>
              </div>
            ) : (
              <>
                <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                  {displayLines.map((line) => (
                    <div
                      key={line.id}
                      className="flex items-center gap-3 border-b border-line pb-3 last:border-b-0"
                    >
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-surface-muted">
                        <SafeImage src={line.image} alt={line.name} className="h-full w-full object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-ink">{line.name}</p>
                        <p className="text-xs font-bold text-brand-600">
                          {formatMoney(line.unitPrice)} × {line.quantity} = {formatMoney(line.subtotal)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => void updateLineQuantity(line, line.quantity - 1)}
                          aria-label={t("remove")}
                          className="grid h-7 w-7 place-items-center rounded-lg border border-line bg-surface-muted text-sm font-bold text-ink hover:bg-line"
                        >
                          −
                        </button>
                        <span className="min-w-5 text-center text-xs font-bold text-ink">{line.quantity}</span>
                        <button
                          type="button"
                          onClick={() => void updateLineQuantity(line, line.quantity + 1)}
                          aria-label={t("addToCart")}
                          className="grid h-7 w-7 place-items-center rounded-lg border border-line bg-surface-muted text-sm font-bold text-ink hover:bg-line"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {orderError && <p className="mt-2 text-xs font-semibold text-danger">{orderError}</p>}

                <div className="mt-4 border-t border-line pt-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs font-bold text-ink-muted">{t("subtotalExclDelivery")}</span>
                    <span className="text-xl font-black text-ink">{formatMoney(miniCartSubtotal)}</span>
                  </div>
                  <button
                    type="button"
                    disabled={placingOrder}
                    onClick={buyNowMiniCart}
                    className="w-full rounded-2xl bg-brand-500 px-5 py-3.5 text-sm font-extrabold text-white shadow-sm transition hover:bg-brand-600 disabled:opacity-50"
                  >
                    ⚡ {t("buyNow")} · {formatMoney(miniCartSubtotal)}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* STEP 3: "Agent-like" Progressive Loading Overlay */}
      {placingOrder && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-xs"
          role="status"
          aria-live="polite"
        >
          <div className="flex w-full max-w-sm flex-col gap-3.5 rounded-3xl bg-surface p-7 shadow-2xl">
            {orderLoadingSteps.slice(0, loadingStepIndex + 1).map((stepText, idx) => {
              const isCurrent = idx === loadingStepIndex;
              return (
                <div key={stepText} className="flex items-center gap-3.5">
                  {isCurrent ? (
                    <span
                      aria-hidden
                      className="h-6 w-6 shrink-0 animate-spin rounded-full border-2 border-dashed border-brand-500"
                    />
                  ) : (
                    <span
                      aria-hidden
                      className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-emerald-600 text-xs font-black text-white"
                    >
                      ✓
                    </span>
                  )}
                  <span
                    className={
                      isCurrent
                        ? "text-sm font-extrabold text-ink"
                        : "text-sm font-semibold text-ink-muted"
                    }
                  >
                    {stepText}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP 4.2: 1000ms Order Placed Success Overlay with visual timer */}
      {orderSuccessVisible && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-xs"
          role="status"
          aria-live="polite"
        >
          <div className="flex w-full max-w-sm flex-col items-center rounded-3xl bg-surface p-7 text-center shadow-2xl">
            <div className="mb-3 grid h-14 w-14 place-items-center rounded-full bg-emerald-600 text-2xl font-black text-white">
              ✓
            </div>
            <h3 className="text-xl font-extrabold text-ink">{t("orderPlaced")}</h3>
            <p className="mt-1 text-xs text-ink-muted">{t("orderPlacedSub")}</p>
            <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-surface-muted">
              <div
                className="h-full bg-emerald-600 transition-all ease-linear"
                style={{
                  width: "100%",
                  animation: "bazarShrinkBar 1000ms linear forwards",
                }}
              />
            </div>
            <style>{`
              @keyframes bazarShrinkBar {
                from { width: 100%; }
                to { width: 0%; }
              }
            `}</style>
          </div>
        </div>
      )}
    </QuickCommerceContext.Provider>
  );
}
