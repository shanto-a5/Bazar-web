/**
 * Domain and transport types for the Bazar website.
 *
 * These mirror the mobile app's `src/domain/types` and the API DTOs declared in
 * `src/api/remote-*.ts`. The server returns these shapes verbatim on catalogue
 * reads, so no mapping layer is needed for those. Fields that the server
 * serialises as `null` are typed nullable here.
 */

export interface BaseEntity {
  id: string;
  createdAt: string | null;
  updatedAt: string | null;
}

export type Role = "customer" | "seller";

export interface Category extends BaseEntity {
  name: string;
  icon: string;
  image: string;
  parentId: string | null;
  order: number;
}

export type ProductStatus =
  | "draft"
  | "pending"
  | "active"
  | "paused"
  | "out_of_stock"
  | "archived";

export interface ProductVariant extends BaseEntity {
  productId: string;
  sku: string;
  attributes: Record<string, string>;
  price: number;
  compareAtPrice?: number | null;
  stock: number;
  image?: string;
}

export interface Product extends BaseEntity {
  sellerId: string;
  storeId: string;
  name: string;
  brand: string;
  categoryId: string;
  subcategoryId: string | null;
  description: string;
  highlights: string[];
  images: string[];
  video?: { placeholder?: string; uri?: string } | null;
  regularPrice: number;
  salePrice?: number | null;
  sku: string;
  stock: number;
  lowStockThreshold: number;
  variants: ProductVariant[];
  hasVariants: boolean;
  status: ProductStatus;
  publishedAt?: string | null;
  ratingAvg: number;
  ratingCount: number;
  soldCount: number;
  viewCount: number;
  isNewArrival?: boolean;
}

export type SellerType = "individual" | "business";
export type SellerStatus = "pending" | "active" | "rejected" | "suspended";

export interface SellerProfile extends BaseEntity {
  userId: string;
  storeId: string | null;
  fullName: string;
  phone: string;
  email: string;
  nationalId: string;
  sellerType: SellerType;
  entityName?: string;
  pickupDivision: string;
  pickupDistrict: string;
  pickupArea: string;
  pickupAddressLine: string;
  returnDivision: string;
  returnDistrict: string;
  returnArea: string;
  returnAddressLine: string;
  bank: { bankName: string; accountName: string; accountNumber: string; branch?: string };
  agreement: {
    marketplaceTerms: boolean;
    sellerPolicies: boolean;
    productAuthenticity: boolean;
    fulfillmentResponsibility: boolean;
  };
  status: SellerStatus;
}

export interface Store extends BaseEntity {
  sellerId: string;
  name: string;
  description: string;
  logo: string;
  banner: string;
  status: "active" | "paused";
  ratingAvg: number;
  ratingCount: number;
  responseRate: number;
  responseTimeMinutes: number;
  productCount: number;
  followerCount: number;
  shippingFee: number;
  freeShippingThreshold: number;
  deliveryEstimateDays: { min: number; max: number };
  location: string;
  verified: boolean;
  primaryArea?: { name: string; slug: string } | null;
  serviceAreas?: { name: string; slug: string }[];
}

export interface StoreSummary extends Store {
  seller: Pick<SellerProfile, "id" | "fullName" | "status" | "sellerType">;
  productCount: number;
}

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  /** False only for a quick account whose owner has not chosen a password yet. */
  hasPassword: boolean;
  roles: Role[];
  createdAt: string;
  updatedAt: string;
}

export interface AuthResult {
  user: ApiUser;
  /** Opaque bearer token. The server holds the session; the client only stores this. */
  token: string;
  expiresAt: string;
}

export interface ProductPage {
  items: Product[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CatalogSummary {
  productCount: number;
  activeCount: number;
  storeCount: number;
  sellerCount: number;
  categoryCount: number;
}

export interface ProductDetail {
  product: Product;
  store: Store | null;
  seller: SellerProfile | null;
  effectivePrice: number;
  availableStock: number;
  visible: boolean;
}

export interface AddressDto {
  id: string;
  userId: string;
  label: string;
  recipientName: string;
  phone: string;
  division: string;
  district: string;
  area: string;
  addressLine: string;
  postalCode: string;
  instructions: string | null;
  isDefault: boolean;
  latitude?: number | null;
  longitude?: number | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface AddressInput {
  label?: string;
  recipientName: string;
  phone: string;
  division: string;
  district: string;
  area?: string;
  addressLine?: string;
  postalCode?: string;
  instructions?: string;
  isDefault?: boolean;
  latitude?: number | null;
  longitude?: number | null;
}

export interface ReviewDto {
  id: string;
  userId: string;
  userName: string;
  productId: string;
  sellerId: string;
  orderId: string;
  orderItemId: string;
  rating: number;
  title: string;
  text: string;
  images: string[];
  verifiedPurchase: boolean;
  sellerReply: { text: string; at: string | null } | null;
  helpfulCount: number;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface ProductReviews {
  reviews: ReviewDto[];
  total: number;
  ratingAvg: number;
  ratingCount: number;
}

export type NotificationType =
  | "order_placed"
  | "order_confirmed"
  | "order_shipped"
  | "order_delivered"
  | "order_cancelled"
  | "return_update"
  | "promotion"
  | "voucher"
  | "review_reminder"
  | "review_reply"
  | "seller_new_order"
  | "seller_order_cancelled"
  | "seller_low_stock"
  | "seller_return_request"
  | "seller_review_received"
  | "seller_account_status"
  | "system";

export interface NotificationDto {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  data: Record<string, string> | null;
  createdAt: string;
  updatedAt: string;
}

export interface WishlistItemDto {
  productId: string;
  addedAt: string;
  available: boolean;
  product: Product;
}

export interface FollowStateDto {
  following: boolean;
  followerCount: number;
}

export type VoucherType = "percentage" | "fixed" | "free_shipping";
export type VoucherScope = "platform" | "seller";

export interface Voucher extends BaseEntity {
  code: string;
  title: string;
  type: VoucherType;
  discountValue: number;
  minimumOrder: number;
  maximumDiscount?: number | null;
  scope: VoucherScope;
  sellerId?: string | null;
  categoryId?: string | null;
  productIds?: string[];
  startAt: string;
  expiry: string;
  usageLimit?: number | null;
  usageCount: number;
  perUserLimit?: number | null;
  perUserUsed?: Record<string, number>;
  active: boolean;
  description?: string;
}

export interface EligibleVoucherQuoteDto {
  id: string;
  code: string;
  title: string;
  type: VoucherType;
  discountValue: number;
  scope: VoucherScope;
  sellerId: string | null;
  categoryId: string | null;
  productIds: string[];
  description: string;
  minimumOrder: number;
  maximumDiscount: number | null;
  expiry: string;
  valid: boolean;
  reason: string | null;
  discount: number;
}

export interface PricedCartLine {
  id: string;
  productId: string;
  variantId?: string;
  sellerId: string;
  storeId: string;
  name: string;
  image: string;
  quantity: number;
  selected: boolean;
  unitPrice: number;
  subtotal: number;
  available: boolean;
  unavailableReason: string | null;
  brand: string;
  priceChanged: boolean;
  variantAttributes?: Record<string, string> | null;
}

export interface PricedCartTotals {
  subtotal: number;
  shippingTotal: number;
  voucherDiscount: number;
  cartTotal: number;
  deliveryFee: number;
  grandTotal: number;
  itemCount: number;
  quote: {
    methodId: string;
    label: string;
    caption: string;
    baseFee: number;
    premiumPerSeller: number;
    fee: number;
    daysMin: number;
    daysMax: number;
    window: string;
    sellerCount: number;
  };
}

export type PricedCartIssueKind =
  | "unavailable"
  | "out_of_stock"
  | "reduced"
  | "price_changed"
  | "seller_paused";

export interface PricedCartIssue {
  itemId: string;
  productId: string;
  productName: string;
  kind: PricedCartIssueKind;
  message: string;
  fix: "remove" | "reduce" | "review";
  suggestedQuantity?: number;
  previousPrice?: number;
  currentPrice?: number;
}

export interface PricedSellerGroup {
  sellerId: string;
  storeId: string;
  storeName: string;
  items: PricedCartLine[];
  subtotal: number;
  shippingFee: number;
  freeShipping: boolean;
}

export interface PricedCart {
  cartId: string;
  userId: string;
  items: PricedCartLine[];
  groups: PricedSellerGroup[];
  subtotal: number;
  shippingTotal: number;
  voucherDiscount: number;
  grandTotal: number;
  itemCount: number;
  delivery: {
    methodId: string;
    label: string;
    caption: string;
    baseFee: number;
    premiumPerSeller: number;
    fee: number;
    sellerCount: number;
    daysMin: number;
    daysMax: number;
    window: string;
  };
  checkout: { subtotal: number; voucherDiscount: number; deliveryFee: number; grandTotal: number };
  vouchers: { voucher: Voucher; valid: boolean; discount: number; reason: string | null }[];
  selectedVoucherCode: string | null;
  cart: { id: string | null; items: { id: string; productId: string; quantity: number; selected: boolean }[] };
  totals: PricedCartTotals;
  issues: PricedCartIssue[];
}

export type PaymentMethod = "cod" | "bkash" | "nagad" | "card";
export type PaymentStatus = "pending" | "authorized" | "paid" | "failed" | "refunded";
export type DeliveryMethodId = "standard" | "express";

export type OrderStatus =
  | "placed"
  | "new"
  | "confirmed"
  | "processing"
  | "packed"
  | "ready_to_ship"
  | "shipped"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"
  | "return_requested"
  | "return_approved"
  | "partially_returned"
  | "returned"
  | "refunded";

export interface OrderDto {
  id: string;
  orderCode: string;
  customerId: string;
  status: string;
  sellerOrderIds: string[];
  subtotal: number;
  shippingTotal: number;
  vouchersDiscount: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  deliveryMethod: string;
  shippingAddress: AddressDto | null;
  address?: AddressDto | null;
  voucherCodes: string[];
  placedAt: string | null;
  cancelledAt: string | null;
  deliveredAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface OrderItemSnapshotDto {
  id: string;
  productId: string;
  productName: string;
  brand: string;
  image: string;
  variantId: string | null;
  variantAttributes: Record<string, string> | null;
  unitPrice: number;
  discount: number;
  quantity: number;
  subtotal: number;
  status: string;
  reviewId: string | null;
  hasReview: boolean;
  returnRequestId: string | null;
  returnedQuantity?: number;
  remainingQuantity?: number;
}

export interface SellerOrderDto {
  id: string;
  orderId: string;
  sellerId: string;
  storeId: string;
  storeName: string;
  storeLogo: string;
  status: string;
  items: SellerOrderItemDto[];
  subtotal: number;
  shippingFee: number;
  vouchersDiscount: number;
  total: number;
  shippingAddress: AddressDto | null;
  carrier: string | null;
  trackingNumber: string | null;
  timeline: { status: string; at: string | null }[];
  fulfilledAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  order: {
    id: string;
    orderCode: string;
    status: string;
    paymentMethod: string;
    paymentStatus: string;
    total: number;
    placedAt: string | null;
    shippingAddress: AddressDto | null;
  } | null;
}

export interface SellerOrderItemDto {
  id: string;
  productId: string;
  productName: string;
  brand: string;
  image: string;
  variantId: string | null;
  variantAttributes: Record<string, string> | null;
  unitPrice: number;
  discount: number;
  quantity: number;
  subtotal: number;
  status: string;
  reviewId: string | null;
  hasReview: boolean;
  returnRequestId: string | null;
}

export interface OrderPaymentDto {
  id: string;
  orderId: string;
  method: string;
  amount: number;
  status: string;
  reference: string | null;
  paidAt: string | null;
  refundedAt: string | null;
  refundedAmount: number;
  createdAt: string | null;
}

export interface OrderReceiptDto {
  order: OrderDto;
  sellerOrders: SellerOrderDto[];
  payment: OrderPaymentDto | null;
}

export interface OrderDetailDto {
  order: OrderDto;
  sellerOrders: SellerOrderDto[];
  payment: OrderPaymentDto[];
}

export interface CheckoutInput {
  address: AddressInput;
  paymentMethod: PaymentMethod;
  deliveryMethod?: DeliveryMethodId;
  voucherCode?: string;
}

export interface CheckoutPreview {
  groups: {
    sellerId: string;
    subtotal: number;
    shippingFee: number;
    hasSelectedLines: boolean;
    items: {
      id: string;
      productName: string;
      quantity: number;
      selected: boolean;
      unitPrice: number;
      subtotal: number;
      available: boolean;
      unavailableReason?: string;
      priceChanged: boolean;
    }[];
  }[];
  totals: {
    subtotal: number;
    shippingTotal: number;
    voucherDiscount: number;
    cartTotal: number;
    deliveryFee: number;
    grandTotal: number;
    itemCount: number;
  };
  quote: { methodId: string; label: string; fee: number; daysMin: number; daysMax: number };
  voucher: { code: string; title: string; amount: number } | null;
}

export interface HealthReport {
  status: "ok" | "degraded";
  service: string;
  version: string;
  apiVersion: string;
  database: { ok: boolean; driver: string; detail?: string };
  config: Record<string, unknown>;
  uptimeSeconds: number;
}
