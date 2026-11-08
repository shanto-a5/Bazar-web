/**
 * Typed API surface.
 *
 * The one place in the website that knows endpoint paths and payload shapes.
 * Screens and services depend on these methods, never on URLs. Every method
 * returns the server's `data` payload and throws `ApiError` on failure.
 */
import { ApiClient, createServerClient, getBrowserClient } from "./client";
import { catalogRevalidateSeconds } from "@/lib/config";
import type {
  AddressInput,
  AuthResult,
  ApiUser,
  CatalogSummary,
  Category,
  HealthReport,
  ProductDetail,
  ProductPage,
  ProductReviews,
  StoreSummary,
} from "@/lib/types";

const REVALIDATE = { revalidate: catalogRevalidateSeconds } as const;

export class BazarApi {
  constructor(private readonly client: ApiClient) {}

  // capability
  health(): Promise<HealthReport> {
    return this.client.get<HealthReport>("/api/v1/health");
  }

  paymentMethods(): Promise<{ methods: { id: string; label: string }[]; note: string }> {
    return this.client.get("/api/v1/meta/payment-methods", { revalidate: 3600 });
  }

  deliveryMethods(): Promise<{ methods: { id: string; label: string; caption: string }[] }> {
    return this.client.get("/api/v1/meta/delivery-methods", { revalidate: 3600 });
  }

  // auth
  register(input: { name: string; email: string; phone: string; password: string }) {
    return this.client.post<AuthResult>("/api/v1/auth/register", input, { authenticated: false });
  }

  login(input: { email: string; password: string }) {
    return this.client.post<AuthResult>("/api/v1/auth/login", input, { authenticated: false });
  }

  /**
   * Frictionless onboarding (M14): a phone number alone mints (or resumes) a
   * session. This is the guest-ordering path - the server generates the email,
   * name and password, so the customer only ever supplies a number.
   */
  quickAccount(input: { phone: string }) {
    return this.client.post<AuthResult>("/api/v1/auth/quick-account", input, { authenticated: false });
  }

  me(): Promise<ApiUser> {
    return this.client.get<{ user: ApiUser }>("/api/v1/auth/me").then((r) => r.user);
  }

  updateProfile(input: { name?: string; email?: string; phone?: string; avatar?: string }) {
    return this.client.patch<{ user: ApiUser }>("/api/v1/auth/me", input);
  }

  changePassword(input: { currentPassword: string; newPassword: string }) {
    return this.client.post<{ changed: boolean; otherSessionsRevoked: boolean }>(
      "/api/v1/auth/me/password",
      input,
    );
  }

  setInitialPassword(input: { newPassword: string }) {
    return this.client.post<{ changed: boolean; otherSessionsRevoked: boolean }>(
      "/api/v1/auth/me/password/initial",
      input,
    );
  }

  logout() {
    return this.client.post<{ loggedOut: boolean }>("/api/v1/auth/logout");
  }

  logoutEverywhere() {
    return this.client.post<{ loggedOutEverywhere: boolean }>("/api/v1/auth/logout-all");
  }

  requestPasswordReset(input: { email: string }) {
    return this.client.post<{ accepted: boolean; expiresInMinutes: number }>(
      "/api/v1/auth/password-reset/request",
      input,
      { authenticated: false },
    );
  }

  confirmPasswordReset(input: { token: string; newPassword: string }) {
    return this.client.post<{ reset: boolean; sessionsRevoked: number }>(
      "/api/v1/auth/password-reset/confirm",
      input,
      { authenticated: false },
    );
  }

  // catalog
  categories(): Promise<{ categories: Category[] }> {
    return this.client.get("/api/v1/catalog/categories", { revalidate: catalogRevalidateSeconds });
  }

  areas(): Promise<{ areas: { name: string; slug: string }[] }> {
    return this.client.get("/api/v1/catalog/areas", { revalidate: catalogRevalidateSeconds });
  }

  products(query: {
    page?: number;
    pageSize?: number;
    sellerId?: string;
    categoryId?: string;
    search?: string;
    area?: string;
  } = {}): Promise<ProductPage> {
    return this.client.get<ProductPage>("/api/v1/catalog/products", { query, ...REVALIDATE });
  }

  product(id: string): Promise<ProductDetail> {
    return this.client.get(`/api/v1/catalog/products/${encodeURIComponent(id)}`, { ...REVALIDATE });
  }

  store(sellerOrStoreId: string): Promise<StoreSummary> {
    return this.client.get(`/api/v1/catalog/stores/${encodeURIComponent(sellerOrStoreId)}`, { ...REVALIDATE });
  }

  summary(): Promise<CatalogSummary> {
    return this.client.get("/api/v1/catalog/summary", { revalidate: 300 });
  }

  productReviews(productId: string, options: { limit?: number; offset?: number } = {}): Promise<ProductReviews> {
    const { limit, offset } = options;
    return this.client.get(`/api/v1/catalog/products/${encodeURIComponent(productId)}/reviews`, {
      query: { limit, offset },
      ...REVALIDATE,
    });
  }

  // cart
  cart(deliveryMethod?: "standard" | "express", voucher?: string): Promise<import("@/lib/types").PricedCart> {
    return this.client.get("/api/v1/cart", { query: { deliveryMethod, voucher } });
  }

  addCartItem(input: { productId: string; quantity?: number; variantId?: string }) {
    return this.client.post<import("@/lib/types").PricedCart>("/api/v1/cart/items", { quantity: 1, ...input });
  }

  patchCartItem(itemId: string, patch: { quantity?: number; selected?: boolean }) {
    return this.client.patch<import("@/lib/types").PricedCart>(
      `/api/v1/cart/items/${encodeURIComponent(itemId)}`,
      patch,
    );
  }

  removeCartItem(itemId: string) {
    return this.client.delete<import("@/lib/types").PricedCart>(
      `/api/v1/cart/items/${encodeURIComponent(itemId)}`,
    );
  }

  clearCart() {
    return this.client.delete<import("@/lib/types").PricedCart>("/api/v1/cart/items");
  }

  selectCartLines(input: { selected: boolean; sellerId?: string }) {
    return this.client.patch<import("@/lib/types").PricedCart>("/api/v1/cart/select", input);
  }

  // vouchers
  eligibleVouchers(): Promise<{ quotes: import("@/lib/types").EligibleVoucherQuoteDto[] }> {
    return this.client.get("/api/v1/vouchers/eligible");
  }

  // notifications
  registerPushDevice(token: string, platform: "web" = "web") {
    return this.client.post<{ registered: boolean }>("/api/v1/notifications/devices", { token, platform });
  }

  unregisterPushDevice() {
    return this.client.post<{ removed: boolean }>("/api/v1/notifications/devices/unregister");
  }

  unregisterPushToken(token: string) {
    return this.client.post<{ removed: boolean }>("/api/v1/notifications/devices/unregister", { token });
  }

  notifications(options: { limit?: number; unread?: boolean } = {}) {
    const { limit, unread } = options;
    return this.client.get<{ notifications: import("@/lib/types").NotificationDto[]; unreadCount: number }>(
      "/api/v1/notifications",
      { query: { limit, unread: unread ? "true" : undefined } },
    );
  }

  unreadNotificationCount() {
    return this.client.get<{ unreadCount: number }>("/api/v1/notifications/unread-count");
  }

  markNotificationRead(id: string) {
    return this.client.patch<{ notification: import("@/lib/types").NotificationDto }>(
      `/api/v1/notifications/${encodeURIComponent(id)}/read`,
      {},
    );
  }

  markAllNotificationsRead() {
    return this.client.post<{ updated: number }>("/api/v1/notifications/read-all", {});
  }

  deleteNotification(id: string) {
    return this.client.delete<{ deleted: true }>(`/api/v1/notifications/${encodeURIComponent(id)}`);
  }

  // wishlist
  wishlist() {
    return this.client.get<{ items: import("@/lib/types").WishlistItemDto[] }>("/api/v1/wishlist");
  }

  addWishlistItem(productId: string) {
    return this.client.post<{ items: import("@/lib/types").WishlistItemDto[] }>("/api/v1/wishlist/items", {
      productId,
    });
  }

  removeWishlistItem(productId: string) {
    return this.client.delete<{ items: import("@/lib/types").WishlistItemDto[] }>(
      `/api/v1/wishlist/items/${encodeURIComponent(productId)}`,
    );
  }

  // store follows
  followedStores() {
    return this.client.get<{ stores: import("@/lib/types").Store[] }>("/api/v1/me/follows");
  }

  followStore(storeId: string) {
    return this.client.post<import("@/lib/types").FollowStateDto>(
      `/api/v1/stores/${encodeURIComponent(storeId)}/follow`,
      {},
    );
  }

  unfollowStore(storeId: string) {
    return this.client.delete<import("@/lib/types").FollowStateDto>(
      `/api/v1/stores/${encodeURIComponent(storeId)}/follow`,
    );
  }

  followState(storeId: string) {
    return this.client.get<import("@/lib/types").FollowStateDto>(
      `/api/v1/stores/${encodeURIComponent(storeId)}/follow`,
    );
  }

  // reviews
  myReviews() {
    return this.client.get<{ reviews: import("@/lib/types").ReviewDto[] }>("/api/v1/reviews/mine");
  }

  createReview(input: {
    orderItemId: string;
    rating: number;
    title: string;
    text: string;
    images?: string[];
    orderId?: string;
    sellerOrderId?: string;
    productId?: string;
    sellerId?: string;
  }) {
    return this.client.post<{ review: import("@/lib/types").ReviewDto }>("/api/v1/reviews", input);
  }

  deleteReview(id: string) {
    return this.client.delete<{ deleted: true }>(`/api/v1/reviews/${encodeURIComponent(id)}`);
  }

  // recently viewed
  recentlyViewed(limit?: number) {
    return this.client.get<{ items: import("@/lib/types").WishlistItemDto[] }>("/api/v1/recently-viewed", {
      query: { limit },
    });
  }

  recordView(productId: string) {
    return this.client.post<{ entry: { productId: string; addedAt: string } }>("/api/v1/recently-viewed", {
      productId,
    });
  }

  // orders
  createOrder(input: import("@/lib/types").CheckoutInput) {
    return this.client.post<import("@/lib/types").OrderReceiptDto>("/api/v1/orders", input);
  }

  orders() {
    return this.client.get<{ orders: import("@/lib/types").OrderDto[] }>("/api/v1/orders");
  }

  order(id: string) {
    return this.client.get<import("@/lib/types").OrderDetailDto>(`/api/v1/orders/${encodeURIComponent(id)}`);
  }

  checkoutPreview(input: { deliveryMethod?: "standard" | "express"; voucherCode?: string }) {
    return this.client.post<import("@/lib/types").CheckoutPreview>("/api/v1/checkout/preview", input);
  }

  // addresses
  addresses() {
    return this.client.get<{ addresses: import("@/lib/types").AddressDto[] }>("/api/v1/addresses");
  }

  createAddress(input: AddressInput) {
    return this.client.post<{ address: import("@/lib/types").AddressDto }>("/api/v1/addresses", input);
  }

  updateAddress(id: string, patch: Partial<AddressInput>) {
    return this.client.patch<{ address: import("@/lib/types").AddressDto }>(
      `/api/v1/addresses/${encodeURIComponent(id)}`,
      patch,
    );
  }

  deleteAddress(id: string) {
    return this.client.delete<{ deleted: true; addresses: import("@/lib/types").AddressDto[] }>(
      `/api/v1/addresses/${encodeURIComponent(id)}`,
    );
  }

  setDefaultAddress(id: string) {
    return this.client.post<{ address: import("@/lib/types").AddressDto }>(
      `/api/v1/addresses/${encodeURIComponent(id)}/default`,
    );
  }
}

/** Server-side client for public (token-less) reads. */
export const serverApi = new BazarApi(createServerClient());

/** Browser client whose token is managed by the session store. */
let browserApi: BazarApi | null = null;
export function getBrowserApi(): BazarApi {
  if (!browserApi) browserApi = new BazarApi(getBrowserClient());
  return browserApi;
}
