import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductGrid } from "@/components/product-card";
import { EmptyState } from "@/components/ui";
import { BazarApi } from "@/lib/api/bazar-api";
import { createServerClient } from "@/lib/api/client";

type Params = Promise<{ id: string }>;
type SearchParams = Promise<{ page?: string }>;
const PAGE_SIZE = 20;

async function getCategory(id: string) {
  const api = new BazarApi(createServerClient());
  const [{ categories }, products] = await Promise.all([
    api.categories().catch(() => ({ categories: [] })),
    api.products({ page: 1, pageSize: 1, categoryId: id }).catch(() => null),
  ]);
  const category = categories.find((c) => c.id === id) ?? null;
  return { category, known: categories.length === 0 || category !== null, productCount: products?.total ?? 0 };
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const { category } = await getCategory(id);
  if (!category) return { title: "Category" };
  return {
    title: category.name,
    description: `Shop ${category.name} on Bazar. Compare prices and order with cash on delivery.`,
    alternates: { canonical: `/category/${category.id}` },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { id } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1);

  const api = new BazarApi(createServerClient());
  const [categoryResult, productsResult] = await Promise.allSettled([
    api.categories(),
    api.products({ page, pageSize: PAGE_SIZE, categoryId: id }),
  ]);

  const categories = categoryResult.status === "fulfilled" ? categoryResult.value.categories : [];
  const category = categories.find((c) => c.id === id);
  if (categories.length > 0 && !category) notFound();

  const products = productsResult.status === "fulfilled" ? productsResult.value : null;
  const totalPages = products ? Math.max(1, Math.ceil(products.total / products.pageSize)) : 1;

  return (
    <div className="container-page py-6">
      <nav aria-label="Breadcrumb" className="mb-3 text-sm text-ink-muted">
        <Link href="/" className="hover:text-brand-600">Home</Link>
        <span className="px-1.5">/</span>
        <Link href="/categories" className="hover:text-brand-600">Categories</Link>
        <span className="px-1.5">/</span>
        <span className="text-ink">{category?.name ?? "Category"}</span>
      </nav>

      <h1 className="text-2xl font-bold text-ink">{category?.name ?? "Category"}</h1>
      {products && (
        <p className="mt-1 text-sm text-ink-muted">{products.total.toLocaleString()} products</p>
      )}

      <div className="mt-6">
        {products && products.items.length > 0 ? (
          <ProductGrid products={products.items} />
        ) : (
          <EmptyState title="No products in this category" description="Please check back soon." />
        )}
      </div>

      {products && totalPages > 1 && (
        <nav aria-label="Pagination" className="mt-8 flex items-center justify-center gap-3 text-sm">
          {page > 1 && (
            <Link
              href={`/category/${id}?page=${page - 1}`}
              className="rounded-full border border-line bg-surface px-4 py-2 font-medium hover:border-brand-400 hover:text-brand-600"
            >
              Previous
            </Link>
          )}
          <span className="text-ink-muted">Page {page} of {totalPages}</span>
          {page < totalPages && (
            <Link
              href={`/category/${id}?page=${page + 1}`}
              className="rounded-full border border-line bg-surface px-4 py-2 font-medium hover:border-brand-400 hover:text-brand-600"
            >
              Next
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
