import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FollowButton } from "@/components/follow-button";
import { ProductGrid } from "@/components/product-card";
import { SafeImage } from "@/components/safe-image";
import { Badge, EmptyState, Stars } from "@/components/ui";
import { BazarApi } from "@/lib/api/bazar-api";
import { createServerClient } from "@/lib/api/client";
import { absoluteUrl } from "@/lib/seo";

type Params = Promise<{ id: string }>;
type SearchParams = Promise<{ page?: string }>;
const PAGE_SIZE = 20;

async function loadStore(id: string) {
  const api = new BazarApi(createServerClient());
  return api.store(id).catch(() => null);
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const store = await loadStore(id);
  if (!store) return { title: "Store not found", robots: { index: false, follow: false } };
  return {
    title: store.name,
    description: store.description || `Shop products from ${store.name} on Bazar.`,
    alternates: { canonical: `/store/${store.id}` },
    openGraph: {
      title: store.name,
      description: store.description,
      images: store.banner ? [{ url: absoluteUrl(store.banner) }] : undefined,
    },
  };
}

export default async function StorePage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { id } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1);

  const store = await loadStore(id);
  if (!store) notFound();

  const api = new BazarApi(createServerClient());
  const products = await api
    .products({ page, pageSize: PAGE_SIZE, sellerId: store.sellerId })
    .catch(() => null);
  const totalPages = products ? Math.max(1, Math.ceil(products.total / products.pageSize)) : 1;

  return (
    <div className="container-page py-6">
      <nav aria-label="Breadcrumb" className="mb-3 text-sm text-ink-muted">
        <Link href="/" className="hover:text-brand-600">Home</Link>
        <span className="px-1.5">/</span>
        <span className="text-ink">{store.name}</span>
      </nav>

      <div className="overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface">
        <div className="h-32 w-full bg-surface-muted sm:h-44">
          <SafeImage src={store.banner} alt="" className="h-full w-full" />
        </div>
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
          <div className="-mt-14 h-20 w-20 shrink-0 overflow-hidden rounded-full border-4 border-surface bg-surface-muted sm:-mt-16 sm:h-24 sm:w-24">
            <SafeImage src={store.logo} alt={store.name} className="h-full w-full" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-xl font-bold text-ink">{store.name}</h1>
              {store.status === "active" && <Badge tone="success">Active</Badge>}
            </div>
            <p className="text-sm text-ink-muted">{store.location}</p>
            {store.description && <p className="mt-1 line-clamp-2 text-sm text-ink-muted">{store.description}</p>}
            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-ink-muted">
              <span className="flex items-center gap-1"><Stars value={store.ratingAvg} /> {store.ratingAvg.toFixed(1)}</span>
              <span>{store.productCount.toLocaleString()} products</span>
              <span>{store.followerCount.toLocaleString()} followers</span>
            </div>
          </div>
          <FollowButton storeId={store.id} />
        </div>
      </div>

      <h2 className="mb-4 mt-8 text-lg font-bold text-ink">Products</h2>
      {products && products.items.length > 0 ? (
        <ProductGrid products={products.items} />
      ) : (
        <EmptyState title="No products yet" description="This store has not published any products." />
      )}

      {products && totalPages > 1 && (
        <nav aria-label="Pagination" className="mt-8 flex items-center justify-center gap-3 text-sm">
          {page > 1 && (
            <Link href={`/store/${id}?page=${page - 1}`} className="rounded-full border border-line bg-surface px-4 py-2 font-medium hover:border-brand-400">
              Previous
            </Link>
          )}
          <span className="text-ink-muted">Page {page} of {totalPages}</span>
          {page < totalPages && (
            <Link href={`/store/${id}?page=${page + 1}`} className="rounded-full border border-line bg-surface px-4 py-2 font-medium hover:border-brand-400">
              Next
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
