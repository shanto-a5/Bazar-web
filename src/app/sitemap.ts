import type { MetadataRoute } from "next";
import { BazarApi } from "@/lib/api/bazar-api";
import { createServerClient } from "@/lib/api/client";
import { siteUrl } from "@/lib/config";

export const revalidate = 3600;

const MAX_PRODUCT_PAGES = 10;
const PAGE_SIZE = 48;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const api = new BazarApi(createServerClient());
  const now = new Date();

  const entries: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/catalogue`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/categories`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
  ];

  try {
    const { categories } = await api.categories();
    for (const category of categories) {
      entries.push({
        url: `${siteUrl}/category/${category.id}`,
        lastModified: now,
        changeFrequency: "daily",
        priority: 0.8,
      });
    }
  } catch {
    // Catalogue unavailable; still emit the static routes.
  }

  try {
    for (let page = 1; page <= MAX_PRODUCT_PAGES; page += 1) {
      const result = await api.products({ page, pageSize: PAGE_SIZE });
      for (const product of result.items) {
        entries.push({
          url: `${siteUrl}/product/${product.id}`,
          lastModified: now,
          changeFrequency: "weekly",
          priority: 0.6,
        });
      }
      if (page * PAGE_SIZE >= result.total) break;
    }
  } catch {
    // Products unavailable; emit what we have.
  }

  return entries;
}
