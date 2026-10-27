/**
 * Cart grouping + checkout total arithmetic, mirrored from the mobile app's
 * `shared/pricing.ts`. Only one implementation of the money maths exists.
 */
import { roundMoney } from './money';
import type {
  ResolvedCartLine,
  SharedCartTotals,
  SharedProduct,
  SharedSellerGroup,
  SharedStore,
  SharedVoucher,
} from './types';

const FREE_SHIPPING_BELOW_FEE = 0;

export function lineSubtotal(unitPrice: number, quantity: number): number {
  return roundMoney(unitPrice * quantity);
}

export function shippingFeeForGroup(
  store: SharedStore,
  selectedSubtotal: number,
  hasSelectedLines: boolean,
): number {
  if (!hasSelectedLines) return FREE_SHIPPING_BELOW_FEE;
  return isGroupFreeShipping(store, selectedSubtotal) ? FREE_SHIPPING_BELOW_FEE : store.shippingFee;
}

export function isGroupFreeShipping(store: SharedStore, selectedSubtotal: number): boolean {
  return selectedSubtotal >= store.freeShippingThreshold || store.shippingFee === 0;
}

/** Group already-resolved cart lines per seller and price each seller's shipping. */
export function groupLinesBySeller<TProduct extends SharedProduct>(
  lines: ResolvedCartLine<TProduct>[],
  unitPriceOf: (line: ResolvedCartLine<TProduct>) => number,
  storeOf: (sellerId: string) => SharedStore | undefined,
): SharedSellerGroup[] {
  const bySeller = new Map<string, ResolvedCartLine<TProduct>[]>();
  for (const line of lines) {
    const group = bySeller.get(line.sellerId);
    if (group) group.push(line);
    else bySeller.set(line.sellerId, [line]);
  }

  const groups: SharedSellerGroup[] = [];
  for (const [sellerId, sellerLines] of bySeller) {
    const store = storeOf(sellerId);
    if (!store) continue;
    const selectedLines = sellerLines.filter((line) => line.selected);
    const subtotal = roundMoney(
      selectedLines.reduce((sum, line) => sum + lineSubtotal(unitPriceOf(line), line.quantity), 0),
    );
    groups.push({
      sellerId,
      subtotal,
      shippingFee: shippingFeeForGroup(store, subtotal, selectedLines.length > 0),
      freeShipping: isGroupFreeShipping(store, subtotal),
    });
  }
  return groups;
}

/** Voucher discount actually subtracted from a total (rounded, authoritative). */
export function computeVoucherDiscount(
  voucher: SharedVoucher | null,
  groups: SharedSellerGroup[],
  subtotal: number,
  shippingTotal: number,
): number {
  if (!voucher) return 0;
  let voucherDiscount = 0;
  if (voucher.type === 'free_shipping') {
    voucherDiscount =
      voucher.scope === 'seller' && voucher.sellerId
        ? roundMoney(
            groups
              .filter((g) => g.sellerId === voucher.sellerId)
              .reduce((sum, g) => sum + g.shippingFee, 0),
          )
        : shippingTotal;
  } else if (voucher.type === 'percentage') {
    let base = subtotal;
    if (voucher.scope === 'seller' && voucher.sellerId) {
      base = groups.filter((g) => g.sellerId === voucher.sellerId).reduce((sum, g) => sum + g.subtotal, 0);
    }
    const raw = roundMoney((base * voucher.discountValue) / 100);
    voucherDiscount = Math.min(raw, voucher.maximumDiscount ?? Infinity);
  } else {
    let base = subtotal;
    if (voucher.scope === 'seller' && voucher.sellerId) {
      base = groups.filter((g) => g.sellerId === voucher.sellerId).reduce((sum, g) => sum + g.subtotal, 0);
    }
    voucherDiscount = Math.min(voucher.discountValue, base);
  }
  return roundMoney(voucherDiscount);
}

export function computeCartTotals(
  groups: SharedSellerGroup[],
  voucher: SharedVoucher | null,
  itemCount: number,
): SharedCartTotals {
  const subtotal = roundMoney(groups.reduce((sum, group) => sum + group.subtotal, 0));
  const shippingTotal = roundMoney(groups.reduce((sum, group) => sum + group.shippingFee, 0));
  const voucherDiscount = computeVoucherDiscount(voucher, groups, subtotal, shippingTotal);
  const grandTotal = roundMoney(subtotal + shippingTotal - voucherDiscount);
  return { subtotal, shippingTotal, voucherDiscount, grandTotal, itemCount };
}

export function countSelectedItems(lines: { selected: boolean; quantity: number }[]): number {
  return lines.filter((line) => line.selected).reduce((sum, line) => sum + line.quantity, 0);
}
