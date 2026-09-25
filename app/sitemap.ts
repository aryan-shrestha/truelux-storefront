import type { MetadataRoute } from "next";

import { listProducts } from "@/lib/api/catalog";
import { ApiError, ApiUnreachableError } from "@/lib/api/errors";
import { navigationBrands } from "@/lib/catalog/navigation";
import { env } from "@/lib/env";

// The API's maximum page size, so the sitemap costs ceil(products / 100) cache keys.
const PAGE_SIZE = 100;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [slugs, brands] = await Promise.all([productSlugs(), navigationBrands()]);

  return [
    { url: env.siteUrl, changeFrequency: "daily", priority: 1 },
    { url: `${env.siteUrl}/products`, changeFrequency: "daily", priority: 0.8 },
    { url: `${env.siteUrl}/brands`, changeFrequency: "weekly", priority: 0.7 },
    ...brands.map((brand) => ({
      url: `${env.siteUrl}/brands/${encodeURIComponent(brand.slug)}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...slugs.map((slug) => ({
      url: `${env.siteUrl}/products/${encodeURIComponent(slug)}`,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}

// An API failure yields what was read so far: a deploy must not fail because the backend restarted.
async function productSlugs(): Promise<string[]> {
  const slugs: string[] = [];
  try {
    for (let offset = 0; ; offset += PAGE_SIZE) {
      const page = await listProducts({ limit: PAGE_SIZE, offset });
      slugs.push(...page.results.map((product) => product.slug));
      if (page.next === null || page.results.length === 0) return slugs;
    }
  } catch (error) {
    if (error instanceof ApiError || error instanceof ApiUnreachableError) return slugs;
    throw error;
  }
}
