import type { Metadata } from "next";
import Link from "next/link";
import { ProductGrid } from "@/components/product-card";
import { EmptyState } from "@/components/ui";
import { BazarApi } from "@/lib/api/bazar-api";
import { createServerClient } from "@/lib/api/client";
import type { Category } from "@/lib/types";

type SearchParams = Promise<{ search?: string; categoryId?: string; page?: string }>;

const PAGE_SIZE = 20;

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const { search } = await searchParams;
  const title = search ? `Search results for “${search}”` : "All products";
  return {
    title,
    description: search
      ? `Products matching “${search}” on Bazar.`
      : "Browse every product available on Bazar from trusted sellers across Bangladesh.",
    alternates: { canonical: search ? `/catalogue?search=${encodeURIComponent(search)}` : "/catalogue" },
    robots: search ? { index: false, follow: true } : undefined,
  };
}

export default async function CataloguePage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const search = params.search?.trim() ?? "";
  const categoryId = params.categoryId?.trim() ?? "";
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

  const api = new BazarApi(createServerClient());
  const [productsResult, categoriesResult] = await Promise.allSettled([
    api.products({ page, pageSize: PAGE_SIZE, search: search || undefined, categoryId: categoryId || undefined }),
    api.categories(),
  ]);

  const products = productsResult.status === "fulfilled" ? productsResult.value : null;
  const categories: Category[] = categoriesResult.status === "fulfilled" ? categoriesResult.value.categories : [];
  const activeCategory = categories.find((category) => category.id === categoryId);
  const totalPages = products ? Math.max(1, Math.ceil(products.total / products.pageSize)) : 1;

  return (
    <div className="container-page py-6">
      <nav aria-label="Breadcrumb" className="mb-3 text-sm text-ink-muted">
        <Link href="/" className="hover:text-brand-600">Home</Link>
        <span className="px-1.5">/</span>
        <span className="text-ink">{activeCategory ? activeCategory.name : search ? `Search` : "All products"}</span>
      </nav>

      <h1 className="text-2xl font-bold text-ink">
        {activeCategory ? activeCategory.name : search ? `Results for “${search}”` : "All products"}
      </h1>
      {products && (
        <p className="mt-1 text-sm text-ink-muted">{products.total.toLocaleString()} products found</p>
      )}

      {categories.length > 0 && (
        <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">
          <FilterPill href={buildHref({ search, page: 1 })} active={!categoryId}>
            All
          </FilterPill>
          {categories.map((category) => (
            <FilterPill
              key={category.id}
              href={buildHref({ search, categoryId: category.id, page: 1 })}
              active={category.id === categoryId}
            >
              {category.name}
            </FilterPill>
          ))}
        </div>
      )}

      <div className="mt-6">
        {products && products.items.length > 0 ? (
          <ProductGrid products={products.items} />
        ) : (
          <EmptyState
            title="No products found"
            description={
              search
                ? `We could not find anything for “${search}”. Try a different search term.`
                : "There are no products to show right now. Please check back soon."
            }
            action={
              <Link href="/catalogue" className="text-sm font-semibold text-brand-600 hover:underline">
                Clear filters
              </Link>
            }
          />
        )}
      </div>

      {products && totalPages > 1 && (
        <nav aria-label="Pagination" className="mt-8 flex items-center justify-center gap-2">
          <PageLink
            href={buildHref({ search, categoryId, page: page - 1 })}
            disabled={page <= 1}
          >
            Previous
          </PageLink>
          <span className="px-3 text-sm text-ink-muted">
            Page {page} of {totalPages}
          </span>
          <PageLink
            href={buildHref({ search, categoryId, page: page + 1 })}
            disabled={page >= totalPages}
          >
            Next
          </PageLink>
        </nav>
      )}
    </div>
  );
}

function buildHref({
  search,
  categoryId,
  page,
}: {
  search?: string;
  categoryId?: string;
  page?: number;
}): string {
  const query = new URLSearchParams();
  if (search) query.set("search", search);
  if (categoryId) query.set("categoryId", categoryId);
  if (page && page > 1) query.set("page", String(page));
  const qs = query.toString();
  return qs ? `/catalogue?${qs}` : "/catalogue";
}

function FilterPill({
  href,
  active,
  children,
}: {
  href: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "border-brand-500 bg-brand-500 text-white"
          : "border-line bg-surface text-ink-muted hover:border-brand-300 hover:text-brand-600"
      }`}
    >
      {children}
    </Link>
  );
}

function PageLink({
  href,
  disabled,
  children,
}: {
  href: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  if (disabled) {
    return (
      <span className="rounded-full border border-line px-4 py-2 text-sm text-ink-faint opacity-60">
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      className="rounded-full border border-line bg-surface px-4 py-2 text-sm font-medium text-ink hover:border-brand-400 hover:text-brand-600"
    >
      {children}
    </Link>
  );
}
