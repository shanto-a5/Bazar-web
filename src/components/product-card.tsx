"use client";

import { useLanguage } from "@/components/language-provider";
import { useQuickCommerce } from "@/components/quick-commerce";
import { SafeImage } from "@/components/safe-image";
import { Badge } from "@/components/ui";
import { discountPercent, effectivePrice, formatMoney } from "@/lib/format";
import type { Product } from "@/lib/types";

export function ProductCard({ product, className }: { product: Product; className?: string }) {
  const { openQuickView } = useQuickCommerce();
  const { t } = useLanguage();
  const price = effectivePrice(product);
  const discount = discountPercent(product.regularPrice, product.salePrice);
  const image = product.images?.[0];

  return (
    <button
      type="button"
      onClick={() => openQuickView(product)}
      className={`group flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface text-left shadow-sm transition-shadow hover:shadow-md ${className ?? ""}`}
    >
      <div className="relative aspect-square w-full overflow-hidden bg-surface-muted">
        <SafeImage
          src={image}
          alt={product.name}
          className="h-full w-full transition-transform duration-300 group-hover:scale-105"
        />
        {discount > 0 && (
          <span className="absolute left-2 top-2 rounded-full bg-brand-500 px-2 py-1 text-xs font-bold text-white shadow">
            -{discount}%
          </span>
        )}
        {product.ratingCount > 0 && (
          <span className="absolute bottom-2 left-2 rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white">
            ★ {product.ratingAvg.toFixed(1)}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <h3 className="line-clamp-2 min-h-10 text-sm font-medium leading-5 text-ink group-hover:text-brand-600">
          {product.name}
        </h3>
        {product.brand && <p className="text-xs text-ink-faint">{product.brand}</p>}
        <div className="mt-auto flex items-baseline gap-2">
          <span className="text-base font-bold text-brand-600">{formatMoney(price)}</span>
          {discount > 0 && (
            <span className="text-xs text-ink-faint line-through">{formatMoney(product.regularPrice)}</span>
          )}
        </div>
        {product.soldCount > 0 && (
          <p className="text-xs text-ink-faint">
            {product.soldCount} {t("soldSuffix")}
          </p>
        )}
        {product.stock <= 0 && <Badge tone="danger">{t("outOfStock")}</Badge>}
      </div>
    </button>
  );
}

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-5">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
