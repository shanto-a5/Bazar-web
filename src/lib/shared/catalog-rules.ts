/**
 * Catalogue visibility + availability rules, mirrored from the mobile app's
 * `shared/catalog-rules.ts`. Data-free: store/seller lookups are injected.
 */
import type { CatalogLookups, SharedProduct, SharedVariant } from './types';

export function productStock(product: SharedProduct): number {
  if (product.hasVariants && product.variants.length > 0) {
    return product.variants.reduce((sum, variant) => sum + variant.stock, 0);
  }
  return product.stock;
}

export function stockLevelOf(product: SharedProduct): 'out' | 'low' | 'healthy' {
  const stock = productStock(product);
  if (stock <= 0) return 'out';
  if (stock <= product.lowStockThreshold) return 'low';
  return 'healthy';
}

export function customerVisibility(product: SharedProduct, lookups: CatalogLookups): boolean {
  if (product.status !== 'active') return false;
  const store = lookups.getStoreById(product.storeId) ?? lookups.getStoreBySellerId(product.sellerId);
  if (!store || store.status !== 'active') return false;
  const seller = lookups.getSellerById(product.sellerId);
  if (!seller || seller.status !== 'active') return false;
  return true;
}

export interface LineAvailability {
  available: boolean;
  reason: string | null;
}

export function lineAvailability(
  product: SharedProduct,
  variant: SharedVariant | undefined,
  quantity: number,
): LineAvailability {
  if (product.hasVariants && !variant) {
    return { available: false, reason: `One of the options for "${product.name}" is no longer available.` };
  }
  const stock = variant ? variant.stock : productStock(product);
  if (stock <= 0) {
    return { available: false, reason: `"${product.name}" does not have enough stock right now.` };
  }
  if (stock < quantity) {
    return { available: false, reason: `"${product.name}" does not have enough stock - only ${stock} left.` };
  }
  return { available: true, reason: null };
}
