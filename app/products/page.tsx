import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ProductListing } from "@/components/catalog/ProductListing";
import { ShopHero } from "@/components/catalog/ShopHero";
import { listingFacets } from "@/lib/catalog/navigation";
import {
  toCanonicalSearch,
  toProductQuery,
  toRequestedSearch,
  type RawSearchParams,
} from "@/lib/catalog/query";
import { env } from "@/lib/env";

export const metadata: Metadata = {
  title: "Shop",
  description: `Skincare, makeup and fragrance at ${env.brandName}.`,
  // Filtered views point at the unfiltered listing, for crawlers that ignore robots.txt.
  alternates: { canonical: "/products" },
};

export default async function ProductsPage({ searchParams }: PageProps<"/products">) {
  const raw: RawSearchParams = await searchParams;
  const query = toProductQuery(raw);

  // One canonical URL per view keeps the reachable cache keys bounded (ADR 0001, 0004).
  const canonical = toCanonicalSearch(query);
  if (toRequestedSearch(raw) !== canonical) {
    redirect(canonical === "" ? "/products" : `/products?${canonical}`);
  }

  const facets = await listingFacets();

  return (
    <ProductListing
      hero={<ShopHero query={query} categories={facets.categories} />}
      query={query}
      facets={facets}
      pathname="/products"
    />
  );
}
