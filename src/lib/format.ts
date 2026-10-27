/** Shared display formatting helpers, mirrored from the mobile app's `utils/money.ts`. */

export { roundMoney } from "@/lib/shared/money";

const TAKA = "\u09F3";

export function formatMoney(amount: number): string {
  const n = Math.round(Number.isFinite(amount) ? amount : 0);
  return `\u09F3${n.toLocaleString("en-BD")}`;
}

export function formatMoneyShort(amount: number): string {
  const n = Math.round(amount);
  if (n >= 1_000_000) return `\u09F3${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `\u09F3${(n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1)}k`;
  return `\u09F3${n}`;
}

export function discountPercent(regular: number, sale?: number | null): number {
  if (!sale || sale <= 0 || sale >= regular) return 0;
  return Math.round(((regular - sale) / regular) * 100);
}

/** Effective price: the sale price when it is a genuine discount. */
export function effectivePrice(product: { regularPrice: number; salePrice?: number | null }): number {
  const sale = product.salePrice ?? 0;
  return sale > 0 && sale < product.regularPrice ? sale : product.regularPrice;
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-BD", { year: "numeric", month: "short", day: "numeric" });
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-BD", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatRelative(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const diffMs = Date.now() - date.getTime();
  const mins = Math.round(diffMs / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(value);
}

export function formatCount(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(value % 1_000 === 0 ? 0 : 1)}k`;
  return String(value);
}

export { TAKA as moneySymbol };
