import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductGallery } from "@/components/product-gallery";
import { ProductPurchase } from "@/components/product-purchase";
import { ProductGrid } from "@/components/product-card";
import { ReviewList } from "@/components/review-list";
import { Badge, Stars } from "@/components/ui";
import { BazarApi } from "@/lib/api/bazar-api";
import { createServerClient } from "@/lib/api/client";
import { discountPercent, effectivePrice, formatMoney } from "@/lib/format";
import { absoluteUrl, breadcrumbJsonLd, productJsonLd } from "@/lib/seo";
import type { ProductReviews } from "@/lib/types";

type Params = Promise<{ id: string }>;

async function loadProduct(id: string) {
  const api = new BazarApi(createServerClient());
  const detail = await api.product(id).catch(() => null);
  return detail;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const detail = await loadProduct(id);
  if (!detail || !detail.visible) {
    return { title: "Product not found", robots: { index: false, follow: false } };
  }
  const { product } = detail;
  const description =
    product.description?.trim().slice(0, 160) ||
    `Buy ${product.name} on Bazar with cash on delivery across Bangladesh.`;
  return {
    title: product.name,
    description,
    alternates: { canonical: `/product/${product.id}` },
    openGraph: {
      type: "website",
      title: product.name,
      description,
      url: `/product/${product.id}`,
      images: product.images.filter(Boolean).slice(0, 3).map((image) => ({ url: absoluteUrl(image) })),
    },
  };
}

export default async function ProductPage({ params }: { params: Params }) {
  const { id } = await params;

  const api = new BazarApi(createServerClient());
  const detail = await loadProduct(id);
  if (!detail || !detail.visible) notFound();

  const { product, store, availableStock } = detail;

  const [reviewsResult, categoriesResult, relatedResult] = await Promise.allSettled([
    api.productReviews(product.id, { limit: 8 }),
    api.categories(),
    api.products({ page: 1, pageSize: 12, categoryId: product.categoryId }),
  ]);

  const reviews: ProductReviews =
    reviewsResult.status === "fulfilled"
      ? reviewsResult.value
      : { reviews: [], total: 0, ratingAvg: 0, ratingCount: 0 };
  const categories = categoriesResult.status === "fulfilled" ? categoriesResult.value.categories : [];
  const category = categories.find((c) => c.id === product.categoryId);
  const related =
    relatedResult.status === "fulfilled"
      ? relatedResult.value.items.filter((item) => item.id !== product.id).slice(0, 8)
      : [];

  const price = effectivePrice(product);
  const discount = discountPercent(product.regularPrice, product.salePrice);
  const ratingAvg = reviews.ratingCount > 0 ? reviews.ratingAvg : product.ratingAvg;
  const ratingCount = reviews.ratingCount > 0 ? reviews.ratingCount : product.ratingCount;
  const inStock = availableStock > 0;

  const breadcrumb = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: category?.name ?? "Products", path: category ? `/category/${category.id}` : "/catalogue" },
    { name: product.name, path: `/product/${product.id}` },
  ]);

  return (
    <div className="container-page py-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd({ product, store, ratingAvg, ratingCount })) }}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />

      <nav aria-label="Breadcrumb" className="mb-3 text-sm text-ink-muted">
        <Link href="/" className="hover:text-brand-600">Home</Link>
        <span className="px-1.5">/</span>
        {category ? (
          <Link href={`/category/${category.id}`} className="hover:text-brand-600">{category.name}</Link>
        ) : (
          <Link href="/catalogue" className="hover:text-brand-600">Products</Link>
        )}
        <span className="px-1.5">/</span>
        <span className="line-clamp-1 text-ink">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        <ProductGallery images={product.images} name={product.name} />

        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-2xl font-bold text-ink">{product.name}</h1>
            {product.brand && <p className="mt-1 text-sm text-ink-muted">Brand: {product.brand}</p>}
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-ink-muted">
              <span className="flex items-center gap-1">
                <Stars value={ratingAvg} />
                <span>{ratingAvg.toFixed(1)}</span>
                <span>({ratingCount})</span>
              </span>
              {product.soldCount > 0 && <span>{product.soldCount.toLocaleString()} sold</span>}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="text-3xl font-extrabold text-brand-600">{formatMoney(price)}</span>
            {discount > 0 && (
              <>
                <span className="text-lg text-ink-faint line-through">{formatMoney(product.regularPrice)}</span>
                <Badge tone="danger">-{discount}%</Badge>
              </>
            )}
            {!inStock && <Badge tone="neutral">Out of stock</Badge>}
          </div>

          {store && (
            <div className="rounded-[var(--radius-card)] border border-line bg-surface p-4">
              <p className="text-xs uppercase tracking-wide text-ink-faint">Sold by</p>
              <div className="mt-1 flex items-center justify-between gap-3">
                <Link href={`/store/${store.id}`} className="font-semibold text-ink hover:text-brand-600">
                  {store.name}
                </Link>
                {store.status === "active" && <Badge tone="success">Active</Badge>}
              </div>
              <p className="mt-1 text-sm text-ink-muted">{store.location}</p>
            </div>
          )}

          <ProductPurchase product={product} availableStock={availableStock} />

          <dl className="grid grid-cols-2 gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-4 text-sm">
            <div>
              <dt className="text-ink-faint">Delivery</dt>
              <dd className="font-medium text-ink">2–5 days</dd>
            </div>
            <div>
              <dt className="text-ink-faint">Payment</dt>
              <dd className="font-medium text-ink">Cash on delivery</dd>
            </div>
            <div>
              <dt className="text-ink-faint">Returns</dt>
              <dd className="font-medium text-ink">7-day easy return</dd>
            </div>
            <div>
              <dt className="text-ink-faint">SKU</dt>
              <dd className="font-medium text-ink">{product.sku || "—"}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[2fr_1fr]">
        <section>
          <h2 className="text-lg font-bold text-ink">Product details</h2>
          {product.description && (
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink-muted">{product.description}</p>
          )}
          {product.highlights.length > 0 && (
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-ink-muted">
              {product.highlights.map((highlight, index) => (
                <li key={index}>{highlight}</li>
              ))}
            </ul>
          )}
        </section>
        <section className="lg:border-l lg:border-line lg:pl-8">
          <h2 className="text-lg font-bold text-ink">Customer reviews</h2>
          <div className="mt-3">
            <ReviewList data={reviews} productName={product.name} />
          </div>
        </section>
      </div>

      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-lg font-bold text-ink">You may also like</h2>
          <ProductGrid products={related} />
        </section>
      )}
    </div>
  );
}
