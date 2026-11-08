import type { Metadata } from "next";
import Link from "next/link";
import { CategoryIcon } from "@/components/category-icon";
import { BazarApi } from "@/lib/api/bazar-api";
import { createServerClient } from "@/lib/api/client";
import { siteDescription } from "@/lib/config";
import { HomeAreaShopping } from "@/components/home-area-shopping";

export const metadata: Metadata = {
  title: "Shop online in Bangladesh",
  description: siteDescription,
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const api = new BazarApi(createServerClient());

  const [categoriesResult, productsResult] = await Promise.allSettled([
    api.categories(),
    api.products({ page: 1, pageSize: 12 }),
  ]);

  const categories = categoriesResult.status === "fulfilled" ? categoriesResult.value.categories : [];
  const products = productsResult.status === "fulfilled" ? productsResult.value.items : [];

  return (
    <div>
      <section className="bg-gradient-to-br from-brand-500 to-brand-600 text-white">
        <div className="container-page flex flex-col items-start gap-3 py-8 md:gap-4 md:py-14">
          <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
            Cash on delivery across Bangladesh
          </span>
          <h1 className="max-w-2xl text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl md:text-5xl">
            Everything you need from trusted sellers
          </h1>
          <p className="max-w-xl text-sm text-white/90 md:text-base">
            Shop electronics, fashion, home essentials and more. Fast delivery and secure checkout.
          </p>
          <div className="flex flex-wrap gap-3">
          <Link
              href="/catalogue"
              className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-brand-600 hover:bg-brand-50"
            >
              Shop all products
            </Link>
            <Link
              href="/categories"
              className="rounded-full border border-white/60 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
            >
              Browse categories
            </Link>
          </div>
        </div>
      </section>

      {categories.length > 0 && (
        <section className="container-page pt-6 md:pt-8">
          <h2 className="text-lg font-bold text-ink md:text-xl">Shop by category</h2>
          <div className="no-scrollbar mt-3 flex gap-1 overflow-x-auto pb-1">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/category/${category.id}`}
                className="group flex w-[4.5rem] shrink-0 flex-col items-center gap-1.5 px-1 py-1.5"
              >
                <span className="grid h-12 w-12 place-items-center rounded-full bg-surface-muted text-ink-muted transition-colors group-hover:bg-brand-50 group-hover:text-brand-600">
                  <CategoryIcon name={category.name} id={category.id} className="h-6 w-6" />
                </span>
                <span className="line-clamp-2 text-center text-[11px] font-medium leading-tight text-ink-muted group-hover:text-brand-600">
                  {category.name}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="container-page py-8">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-lg font-bold text-ink md:text-xl">Popular right now</h2>
          <Link href="/catalogue" className="text-sm font-semibold text-brand-600 hover:underline">
            View all
          </Link>
          <Link href="/settings" className="rounded-full border border-white/60 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10">Settings</Link>
        </div>
        {products.length > 0 ? (
          <HomeAreaShopping initialProducts={products} />
        ) : (
          <p className="rounded-[var(--radius-card)] border border-dashed border-line bg-surface px-6 py-10 text-center text-sm text-ink-muted">
            Products are unavailable right now. Please try again shortly.
          </p>
        )}
      </section>
    </div>
  );
}
