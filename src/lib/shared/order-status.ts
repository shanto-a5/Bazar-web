/**
 * Order status derivation, mirrored from the mobile app's
 * `shared/order-status.ts`.
 */
import type { SharedOrderStatus, SharedSellerOrderStatus } from './types';

export const SELLER_STATUS_RANK: Record<string, number> = {
  placed: 0,
  new: 0,
  confirmed: 1,
  processing: 2,
  packed: 3,
  ready_to_ship: 4,
  shipped: 5,
  out_for_delivery: 6,
  delivered: 7,
  cancelled: -1,
  return_requested: 8,
  return_approved: 9,
  partially_returned: 10,
  returned: 11,
  refunded: 12,
};

export const SELLER_FULFILLMENT_FLOW: SharedOrderStatus[] = [
  'new',
  'confirmed',
  'processing',
  'packed',
  'ready_to_ship',
  'shipped',
  'out_for_delivery',
  'delivered',
];

export const RETURN_OPEN: SharedOrderStatus[] = ['return_requested', 'return_approved'];
export const RETURN_CLOSED: SharedOrderStatus[] = ['partially_returned', 'returned', 'refunded'];

export function deriveOrderStatus(sellerOrders: SharedSellerOrderStatus[]): SharedOrderStatus {
  if (sellerOrders.length === 0) return 'placed';
  if (sellerOrders.every((sellerOrder) => sellerOrder.status === 'cancelled')) return 'cancelled';
  const live = sellerOrders.filter((sellerOrder) => sellerOrder.status !== 'cancelled');
  if (live.length === 0) return 'cancelled';

  const isReturnStatus = (status: string): boolean =>
    RETURN_OPEN.includes(status as SharedOrderStatus) || RETURN_CLOSED.includes(status as SharedOrderStatus);

  const fulfilment = live.filter((sellerOrder) => !isReturnStatus(sellerOrder.status));

  const inFlight = fulfilment.filter(
    (sellerOrder) =>
      (SELLER_STATUS_RANK[sellerOrder.status] ?? 0) >= 0 && (SELLER_STATUS_RANK[sellerOrder.status] ?? 0) <= 6,
  );
  if (inFlight.length > 0) {
    const least = inFlight.reduce((min, entry) =>
      (SELLER_STATUS_RANK[entry.status] ?? 0) < (SELLER_STATUS_RANK[min.status] ?? 0) ? entry : min,
    );
    const rank = SELLER_STATUS_RANK[least.status] ?? 0;
    return rank <= 0 ? 'placed' : (least.status as SharedOrderStatus);
  }

  const returning = live.filter((sellerOrder) => isReturnStatus(sellerOrder.status));
  if (returning.length > 0) {
    const highest = returning.reduce((max, entry) =>
      (SELLER_STATUS_RANK[entry.status] ?? 0) > (SELLER_STATUS_RANK[max.status] ?? 0) ? entry : max,
    );
    return highest.status as SharedOrderStatus;
  }

  return 'delivered';
}

export function allPartsDelivered(sellerOrders: SharedSellerOrderStatus[]): boolean {
  const live = sellerOrders.filter((sellerOrder) => sellerOrder.status !== 'cancelled');
  if (live.length === 0) return false;
  return live.every((sellerOrder) => (SELLER_STATUS_RANK[sellerOrder.status] ?? 0) >= SELLER_STATUS_RANK.delivered);
}
