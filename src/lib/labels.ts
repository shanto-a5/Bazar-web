import type { OrderStatus } from "@/lib/types";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  placed: "Placed",
  new: "New",
  confirmed: "Confirmed",
  processing: "Processing",
  packed: "Packed",
  ready_to_ship: "Ready to ship",
  shipped: "Shipped",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  return_requested: "Return requested",
  return_approved: "Return approved",
  partially_returned: "Partially returned",
  returned: "Returned",
  refunded: "Refunded",
};

export function orderStatusLabel(status: string): string {
  return ORDER_STATUS_LABELS[status as OrderStatus] ?? status;
}

export function orderStatusTone(
  status: string,
): "neutral" | "brand" | "success" | "danger" | "accent" {
  switch (status) {
    case "delivered":
      return "success";
    case "cancelled":
      return "danger";
    case "shipped":
    case "out_for_delivery":
    case "ready_to_ship":
      return "accent";
    case "return_requested":
    case "return_approved":
    case "partially_returned":
    case "returned":
    case "refunded":
      return "danger";
    default:
      return "brand";
  }
}

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cod: "Cash on delivery",
  bkash: "bKash",
  nagad: "Nagad",
  card: "Card",
};

export function paymentMethodLabel(method: string): string {
  return PAYMENT_METHOD_LABELS[method] ?? method;
}

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: "Payment pending",
  authorized: "Payment authorized",
  paid: "Paid",
  failed: "Payment failed",
  refunded: "Refunded",
};

export function paymentStatusLabel(status: string): string {
  return PAYMENT_STATUS_LABELS[status] ?? status;
}
