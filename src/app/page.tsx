import type { Metadata } from "next";
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
  const productsResult = await api
    .products({ page: 1, pageSize: 24 })
    .catch(() => ({ items: [] }));

  return (
    <section className="container-page py-6">
      <HomeAreaShopping initialProducts={productsResult.items} />
    </section>
  );
}
