"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Alert, Badge, Button, Field, Input, Spinner, Textarea, cn } from "@/components/ui";
import { useSession } from "@/components/session-provider";
import { SafeImage } from "@/components/safe-image";
import { getBrowserApi } from "@/lib/api/bazar-api";
import { ApiError } from "@/lib/api/client";
import { formatMoney } from "@/lib/format";
import { detectAddress } from "@/lib/geocode";
import type {
  AddressDto,
  AddressInput,
  CheckoutPreview,
  DeliveryMethodId,
  EligibleVoucherQuoteDto,
  PaymentMethod,
  PricedCart,
} from "@/lib/types";

const emptyForm = (name: string, phone: string): AddressInput => ({
  label: "Home",
  recipientName: name,
  phone,
  division: "",
  district: "",
  area: "",
  addressLine: "",
  postalCode: "",
  instructions: "",
});

function toInput(address: AddressDto): AddressInput {
  return {
    label: address.label,
    recipientName: address.recipientName,
    phone: address.phone,
    division: address.division,
    district: address.district,
    area: address.area,
    addressLine: address.addressLine,
    postalCode: address.postalCode,
    instructions: address.instructions ?? "",
  };
}

export function CheckoutView() {
  const router = useRouter();
  const api = getBrowserApi();
  const { user } = useSession();

  const [cart, setCart] = useState<PricedCart | null>(null);
  const [addresses, setAddresses] = useState<AddressDto[]>([]);
  const [payments, setPayments] = useState<{ id: string; label: string }[]>([]);
  const [paymentNote, setPaymentNote] = useState("");
  const [vouchers, setVouchers] = useState<EligibleVoucherQuoteDto[]>([]);
  const [preview, setPreview] = useState<CheckoutPreview | null>(null);

  const [useForm, setUseForm] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [form, setForm] = useState<AddressInput>(() => emptyForm(user?.name ?? "", user?.phone ?? ""));

  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethodId>("standard");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
  const [voucherCode, setVoucherCode] = useState<string | undefined>(undefined);

  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationNote, setLocationNote] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const [cartResult, addressResult, paymentResult, voucherResult] = await Promise.allSettled([
        api.cart(),
        api.addresses(),
        api.paymentMethods(),
        api.eligibleVouchers(),
      ]);
      if (!active) return;

      if (cartResult.status === "fulfilled") setCart(cartResult.value);
      if (addressResult.status === "fulfilled") {
        const list = addressResult.value.addresses;
        setAddresses(list);
        const preferred = list.find((address) => address.isDefault) ?? list[0];
        if (preferred) {
          setSelectedAddressId(preferred.id);
          setUseForm(false);
        } else {
          setUseForm(true);
        }
      } else {
        setUseForm(true);
      }
      if (paymentResult.status === "fulfilled") {
        setPayments(paymentResult.value.methods);
        setPaymentNote(paymentResult.value.note);
        const cod = paymentResult.value.methods.find((method) => method.id === "cod");
        if (cod) setPaymentMethod("cod");
        else if (paymentResult.value.methods[0]) setPaymentMethod(paymentResult.value.methods[0].id as PaymentMethod);
      }
      if (voucherResult.status === "fulfilled") setVouchers(voucherResult.value.quotes);
      setReady(true);
    })();
    return () => {
      active = false;
    };
  }, [api]);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    api
      .checkoutPreview({ deliveryMethod, voucherCode })
      .then((next) => {
        if (!cancelled) setPreview(next);
      })
      .catch(() => {
        /* preview is advisory; the order endpoint recomputes totals */
      });
    return () => {
      cancelled = true;
    };
  }, [api, ready, deliveryMethod, voucherCode]);

  const selectedAddress = useMemo(
    () => addresses.find((address) => address.id === selectedAddressId) ?? null,
    [addresses, selectedAddressId],
  );

  const effectiveAddress: AddressInput | null = useForm
    ? form
    : selectedAddress
      ? toInput(selectedAddress)
      : null;

  function update<K extends keyof AddressInput>(key: K, value: AddressInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function useMyLocation() {
    setLocating(true);
    setLocationNote(null);
    const result = await detectAddress();
    setLocating(false);
    if (result.ok) {
      setUseForm(true);
      setForm((prev) => ({
        ...prev,
        division: result.suggestion.division || prev.division,
        district: result.suggestion.district || prev.district,
        area: result.suggestion.area || prev.area,
        addressLine: result.suggestion.addressLine || prev.addressLine,
      }));
      setLocationNote("We filled what we could — please check and complete the address.");
    } else {
      setLocationNote(
        result.reason === "denied"
          ? "Location permission was denied. Please enter your address manually."
          : "We could not detect your location. Please enter your address manually.",
      );
    }
  }

  async function placeOrder() {
    setError(null);
    if (!effectiveAddress) {
      setError("Please choose or add a delivery address.");
      return;
    }
    if (
      !effectiveAddress.recipientName ||
      !effectiveAddress.phone ||
      !effectiveAddress.division ||
      !effectiveAddress.district ||
      !effectiveAddress.addressLine
    ) {
      setError("Please complete all required address fields.");
      return;
    }
    setBusy(true);
    try {
      const receipt = await api.createOrder({
        address: effectiveAddress,
        paymentMethod,
        deliveryMethod,
        voucherCode,
      });
      router.push(`/account/orders/${receipt.order.id}?placed=1`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not place your order. Please try again.");
      setBusy(false);
    }
  }

  if (!ready) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="text-brand-500" />
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <Alert tone="info">
        Your cart is empty.{" "}
        <Link href="/catalogue" className="underline">Start shopping</Link>.
      </Alert>
    );
  }

  const totals = preview
    ? { subtotal: preview.totals.subtotal, shipping: preview.totals.shippingTotal, discount: preview.totals.voucherDiscount, total: preview.totals.grandTotal }
    : { subtotal: cart.subtotal, shipping: cart.shippingTotal, discount: cart.voucherDiscount, total: cart.grandTotal };
  const shippingLabel = deliveryMethod === "express" ? "Express delivery" : "Standard delivery";

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
      <div className="flex flex-col gap-5">
        {error && <Alert>{error}</Alert>}

        <section className="rounded-[var(--radius-card)] border border-line bg-surface p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-ink">Delivery address</h2>
            <button type="button" className="text-sm font-medium text-brand-600 hover:underline disabled:opacity-50" onClick={useMyLocation} disabled={locating}>
              {locating ? "Detecting…" : "Use my location"}
            </button>
          </div>
          {locationNote && <p className="mt-2 text-xs text-ink-muted">{locationNote}</p>}

          {addresses.length > 0 && !useForm && (
            <div className="mt-3 flex flex-col gap-2">
              {addresses.map((address) => (
                <label
                  key={address.id}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm",
                    selectedAddressId === address.id ? "border-brand-400 bg-brand-50/40" : "border-line",
                  )}
                >
                  <input
                    type="radio"
                    name="address"
                    className="mt-0.5"
                    checked={selectedAddressId === address.id}
                    onChange={() => { setUseForm(false); setSelectedAddressId(address.id); }}
                  />
                  <span>
                    <span className="font-semibold text-ink">{address.recipientName}</span>
                    {address.isDefault && <Badge tone="brand" className="ml-2">Default</Badge>}
                    <span className="block text-ink-muted">{address.phone}</span>
                    <span className="block text-ink-muted">
                      {[address.addressLine, address.area, address.district, address.division, address.postalCode].filter(Boolean).join(", ")}
                    </span>
                  </span>
                </label>
              ))}
              <button type="button" className="self-start text-sm font-medium text-brand-600 hover:underline" onClick={() => setUseForm(true)}>
                + Add a new address
              </button>
            </div>
          )}

          {useForm && (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label="Full name" htmlFor="recipientName">
                <Input id="recipientName" value={form.recipientName} onChange={(e) => update("recipientName", e.target.value)} />
              </Field>
              <Field label="Mobile number" htmlFor="phone">
                <Input id="phone" inputMode="numeric" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
              </Field>
              <Field label="Division" htmlFor="division">
                <Input id="division" value={form.division} onChange={(e) => update("division", e.target.value)} placeholder="e.g. Dhaka" />
              </Field>
              <Field label="District" htmlFor="district">
                <Input id="district" value={form.district} onChange={(e) => update("district", e.target.value)} placeholder="e.g. Dhaka" />
              </Field>
              <Field label="Area" htmlFor="area">
                <Input id="area" value={form.area ?? ""} onChange={(e) => update("area", e.target.value)} placeholder="e.g. Mirpur" />
              </Field>
              <Field label="Postal code" htmlFor="postalCode">
                <Input id="postalCode" value={form.postalCode ?? ""} onChange={(e) => update("postalCode", e.target.value)} placeholder="Optional" inputMode="numeric" />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Street address" htmlFor="addressLine">
                  <Input id="addressLine" value={form.addressLine} onChange={(e) => update("addressLine", e.target.value)} placeholder="House, road, landmark" />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field label="Delivery instructions" htmlFor="instructions">
                  <Textarea id="instructions" value={form.instructions ?? ""} onChange={(e) => update("instructions", e.target.value)} placeholder="Optional" />
                </Field>
              </div>
              {addresses.length > 0 && (
                <button type="button" className="self-start text-sm font-medium text-brand-600 hover:underline sm:col-span-2" onClick={() => setUseForm(false)}>
                  Use a saved address instead
                </button>
              )}
            </div>
          )}
        </section>

        <section className="rounded-[var(--radius-card)] border border-line bg-surface p-5">
          <h2 className="font-bold text-ink">Delivery method</h2>
          <div className="mt-3 flex flex-col gap-2">
            {(["standard", "express"] as DeliveryMethodId[]).map((method) => (
              <label key={method} className={cn("flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm", deliveryMethod === method ? "border-brand-400 bg-brand-50/40" : "border-line")}>
                <input type="radio" name="delivery" className="mt-0.5" checked={deliveryMethod === method} onChange={() => setDeliveryMethod(method)} />
                <span>
                  <span className="font-medium capitalize text-ink">{method}</span>
                  <span className="block text-xs text-ink-muted">
                    {method === "express" ? "Priority handling for faster arrival (1–2 days)" : "Store dispatch with tracking (2–5 days)"}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </section>

        <section className="rounded-[var(--radius-card)] border border-line bg-surface p-5">
          <h2 className="font-bold text-ink">Payment method</h2>
          <div className="mt-3 flex flex-col gap-2">
            {payments.map((method) => (
              <label key={method.id} className={cn("flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm", paymentMethod === method.id ? "border-brand-400 bg-brand-50/40" : "border-line")}>
                <input type="radio" name="payment" checked={paymentMethod === method.id} onChange={() => setPaymentMethod(method.id as PaymentMethod)} />
                <span className="font-medium text-ink">{method.label}</span>
              </label>
            ))}
            {payments.length === 0 && <p className="text-sm text-ink-muted">Cash on delivery</p>}
            {paymentNote && <p className="text-xs text-ink-faint">{paymentNote}</p>}
          </div>
        </section>

        {vouchers.length > 0 && (
          <section className="rounded-[var(--radius-card)] border border-line bg-surface p-5">
            <h2 className="font-bold text-ink">Vouchers</h2>
            <div className="mt-3 flex flex-col gap-2">
              {vouchers.map((voucher) => (
                <button
                  key={voucher.id}
                  type="button"
                  disabled={!voucher.valid}
                  onClick={() => setVoucherCode(voucherCode === voucher.code ? undefined : voucher.code)}
                  className={cn(
                    "flex items-center justify-between rounded-lg border p-3 text-left text-sm disabled:opacity-50",
                    voucherCode === voucher.code ? "border-brand-400 bg-brand-50/40" : "border-line",
                  )}
                >
                  <span>
                    <span className="font-semibold text-ink">{voucher.title}</span>
                    <span className="block text-xs text-ink-muted">{voucher.description || voucher.code}</span>
                    {!voucher.valid && voucher.reason && <span className="block text-xs text-danger">{voucher.reason}</span>}
                  </span>
                  {voucher.discount > 0 && <Badge tone="success">− {formatMoney(voucher.discount)}</Badge>}
                </button>
              ))}
            </div>
          </section>
        )}
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-[var(--radius-card)] border border-line bg-surface p-5">
          <h2 className="font-bold text-ink">Order summary</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {cart.items.filter((line) => line.selected).map((line) => (
              <li key={line.id} className="flex items-center gap-3 text-sm">
                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-line bg-surface-muted">
                  <SafeImage src={line.image} alt="" className="h-full w-full" />
                </div>
                <span className="min-w-0 flex-1 truncate text-ink-muted">{line.name}</span>
                <span className="shrink-0 text-ink-muted">×{line.quantity}</span>
                <span className="shrink-0 font-medium text-ink">{formatMoney(line.subtotal)}</span>
              </li>
            ))}
          </ul>

          <dl className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
            <Row label="Subtotal" value={formatMoney(totals.subtotal)} />
            <Row label={shippingLabel} value={formatMoney(totals.shipping)} />
            {totals.discount > 0 && <Row label="Voucher discount" value={`− ${formatMoney(totals.discount)}`} tone="success" />}
            <div className="border-t border-line pt-2">
              <Row label="Total" value={formatMoney(totals.total)} strong />
            </div>
          </dl>

          <Button size="lg" fullWidth className="mt-5" disabled={busy} onClick={placeOrder}>
            {busy ? "Placing order…" : "Place order"}
          </Button>
          <Link href="/cart" className="mt-3 block text-center text-sm font-medium text-brand-600 hover:underline">
            Back to cart
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
      <dd className={strong ? "font-bold text-ink" : tone === "success" ? "font-medium text-success" : "font-medium text-ink"}>{value}</dd>
    </div>
  );
}
