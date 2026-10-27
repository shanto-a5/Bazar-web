import { siteUrl } from "@/lib/config";
import { effectivePrice } from "@/lib/format";
import type { Product, Store } from "@/lib/types";

/** Absolute URL for a site-relative path. */
export function absoluteUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

/** schema.org Product structured data for a product page. */
export function productJsonLd({
  product,
  store,
  ratingAvg,
  ratingCount,
}: {
  product: Product;
  store: Store | null;
  ratingAvg: number;
  ratingCount: number;
}) {
  const price = effectivePrice(product);
  const inStock = product.stock > 0 || product.variants.some((variant) => variant.stock > 0);
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || undefined,
    sku: product.sku || undefined,
    image: product.images.filter(Boolean).map((image) => absoluteUrl(image)),
    brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
    offers: {
      "@type": "Offer",
      url: absoluteUrl(`/product/${product.id}`),
      priceCurrency: "BDT",
      price: price.toFixed(2),
      availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: store ? { "@type": "Organization", name: store.name } : undefined,
    },
    aggregateRating:
      ratingCount > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: ratingAvg.toFixed(1),
            reviewCount: ratingCount,
          }
        : undefined,
  };
}

/** schema.org BreadcrumbList for a product/category page. */
export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}
