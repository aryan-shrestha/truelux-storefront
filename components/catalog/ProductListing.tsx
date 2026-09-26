import Link from "next/link";
import { Suspense, type ReactNode } from "react";

import { CategoryBand } from "@/components/catalog/CategoryBand";
import { FilterPanel } from "@/components/catalog/FilterPanel";
import { Pagination } from "@/components/catalog/Pagination";
import { ProductGrid } from "@/components/catalog/ProductGrid";
import { ProductGridSkeleton } from "@/components/catalog/ProductGridSkeleton";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import type { ProductQuery } from "@/lib/api/types";
import { listingPage } from "@/lib/catalog/listing";
import type { ListingFacets } from "@/lib/catalog/navigation";
import { hasFilters, toCanonicalSearch } from "@/lib/catalog/query";

type ProductListingProps = {
  hero: ReactNode;
  /** The query the URL carries; the brand page adds its brand only for the API. */
  query: ProductQuery;
  facets: ListingFacets;
  pathname: string;
  lockedBrand?: string;
};

export function ProductListing({
  hero,
  query,
  facets,
  pathname,
  lockedBrand,
}: ProductListingProps) {
  const apiQuery = lockedBrand === undefined ? query : { ...query, brand: [lockedBrand] };
  // Keyed on the canonical query, so every filter change shows the skeleton
  // instead of leaving the previous results on screen.
  const boundaryKey = toCanonicalSearch(apiQuery);

  return (
    <div>
      {hero}
      <CategoryBand categories={facets.categories} query={query} pathname={pathname} />

      <div className="max-w-page mx-auto px-4 pt-10 md:px-8 md:pt-14">
        <div className="relative">
          {/* Stays mounted across filters, so the new count is announced. */}
          <p aria-live="polite" className="text-muted-foreground absolute top-3.5 right-12 text-sm">
            <Suspense key={boundaryKey} fallback={<Skeleton className="inline-block h-4 w-16" />}>
              <ProductCount query={apiQuery} />
            </Suspense>
          </p>
          <h2 className="sr-only">Filters</h2>
          <FilterPanel
            facets={facets}
            query={query}
            pathname={pathname}
            showBrands={lockedBrand === undefined}
          />
        </div>

        <div className="mt-12">
          <Suspense key={boundaryKey} fallback={<ProductGridSkeleton />}>
            <Results query={query} apiQuery={apiQuery} pathname={pathname} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

// Results and ProductCount make the same call; Next deduplicates it within a
// render, so it is one upstream request and one cache key.
async function Results({
  query,
  apiQuery,
  pathname,
}: {
  query: ProductQuery;
  apiQuery: ProductQuery;
  pathname: string;
}) {
  const page = await listingPage(apiQuery);

  if (page === null || page.results.length === 0) {
    return <NoResults query={query} pathname={pathname} />;
  }

  return (
    <>
      <h2 className="sr-only">Products</h2>
      <ProductGrid products={page.results} />
      <Pagination count={page.count} query={query} pathname={pathname} />
    </>
  );
}

async function ProductCount({ query }: { query: ProductQuery }) {
  const count = (await listingPage(query))?.count ?? 0;
  return count === 1 ? "1 product" : `${count} products`;
}

function NoResults({ query, pathname }: { query: ProductQuery; pathname: string }) {
  const filtered = Boolean(query.search) || hasFilters(query);

  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyTitle>
          {query.search
            ? `Nothing matches “${query.search}”`
            : filtered
              ? "Nothing matches these filters"
              : "Nothing here yet"}
        </EmptyTitle>
        <EmptyDescription>
          {query.search
            ? "Search matches the words exactly as typed, in a product's name or description. A shorter word usually works better."
            : filtered
              ? "Try removing a filter, or start again from everything."
              : "New products appear here as soon as they are published."}
        </EmptyDescription>
      </EmptyHeader>
      {filtered && (
        <EmptyContent>
          <Button asChild variant="outline">
            <Link href={pathname}>Clear filters</Link>
          </Button>
        </EmptyContent>
      )}
    </Empty>
  );
}
