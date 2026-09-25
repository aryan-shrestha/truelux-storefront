import type { MetadataRoute } from "next";

import { listProducts } from "@/lib/api/catalog";
import { ApiError, ApiUnreachableError } from "@/lib/api/errors";
import { env } from "@/lib/env";

/**
 * The API's maximum page size. The sitemap's product fetch is on the catalogue
 * budget like any other call, so a catalogue of 300 products should cost three
 * requests, not twelve.
 */
const PAGE_SIZE = 100;

/**
 * The home page, the unfiltered listing and every published product. Nothing
 * else: no filtered listings, no cart, no orders.
 *
 * It regenerates on the product fetch's own five-minute revalidate — a route
 * takes the shortest interval of its fetches — so it costs ceil(products / 100)
 * cache keys at 12 an hour, however often it is crawled.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages: MetadataRoute.Sitemap = [
    { url: env.siteUrl, changeFrequency: "daily", priority: 1 },
    { url: `${env.siteUrl}/products`, changeFrequency: "daily", priority: 0.8 },
  ];

  const slugs = await productSlugs();
  return [
    ...pages,
    ...slugs.map((slug) => ({
      url: `${env.siteUrl}/products/${encodeURIComponent(slug)}`,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}

/**
 * Every published product's slug, paginated to exhaustion.
 *
 * An API failure yields the two fixed pages rather than failing the build or
 * serving an error: a sitemap missing products for an hour is recoverable,
 * and a deploy that cannot build because the backend was restarting is not.
 */
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
