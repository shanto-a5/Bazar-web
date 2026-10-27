import type { Metadata } from "next";
import Link from "next/link";
import { CategoryIcon } from "@/components/category-icon";
import { EmptyState } from "@/components/ui";
import { BazarApi } from "@/lib/api/bazar-api";
import { createServerClient } from "@/lib/api/client";

export const metadata: Metadata = {
  title: "All categories",
  description: "Browse every product category on Bazar.",
  alternates: { canonical: "/categories" },
};

export default async function CategoriesPage() {
  const api = new BazarApi(createServerClient());
  const result = await api.categories().catch(() => ({ categories: [] }));
  const categories = result.categories;

  return (
    <div className="container-page py-6">
      <nav aria-label="Breadcrumb" className="mb-3 text-sm text-ink-muted">
        <Link href="/" className="hover:text-brand-600">Home</Link>
        <span className="px-1.5">/</span>
        <span className="text-ink">Categories</span>
      </nav>
      <h1 className="text-2xl font-bold text-ink">All categories</h1>

      {categories.length === 0 ? (
        <div className="mt-6">
          <EmptyState title="No categories yet" description="Categories will appear here once the catalogue is available." />
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4 lg:grid-cols-6">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/category/${category.id}`}
              className="group flex flex-col items-center gap-2 rounded-[var(--radius-card)] border border-line bg-surface p-3 text-center shadow-sm transition-colors hover:border-brand-300 sm:gap-3 sm:p-4"
            >
              <span className="grid h-14 w-14 place-items-center rounded-full bg-surface-muted text-ink-muted transition-colors group-hover:bg-brand-50 group-hover:text-brand-600 sm:h-16 sm:w-16">
                <CategoryIcon name={category.name} id={category.id} className="h-7 w-7" />
              </span>
              <span className="line-clamp-2 text-xs font-medium text-ink group-hover:text-brand-600 sm:text-sm">
                {category.name}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
