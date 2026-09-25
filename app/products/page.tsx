import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import {
  hasFilters,
  toCanonicalSearch,
  toProductQuery,
  toRequestedSearch,
  type RawSearchParams,
} from "@/lib/catalog/query";
import { FilterRail } from "@/components/catalog/FilterRail";
import { Pagination } from "@/components/catalog/Pagination";
import { ProductGrid } from "@/components/catalog/ProductGrid";
import { ProductGridSkeleton } from "@/components/catalog/ProductGridSkeleton";
import { Skeleton } from "@/components/ui/Skeleton";
import { listProducts } from "@/lib/api/catalog";
import type { ProductQuery } from "@/lib/api/types";
import { navigationCategories } from "@/lib/catalog/navigation";
import { env } from "@/lib/env";

export const metadata: Metadata = {
  title: "Shop",
  description: `Everything ${env.brandName} currently sells.`,
};

export default async function ProductsPage({ searchParams }: PageProps<"/products">) {
  const raw = (await searchParams) as RawSearchParams;
  const query = toProductQuery(raw);

  // One canonical URL per view: a crawler cannot hold two, and the set of
  // reachable cache keys stays bounded (ADR 0001, ADR 0004).
  const canonical = toCanonicalSearch(query);
  if (toRequestedSearch(raw) !== canonical) {
    redirect(canonical === "" ? "/products" : `/products?${canonical}`);
  }

  const categories = await navigationCategories();

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-12 sm:px-8 md:px-[50px]">
      <header className="mb-10 flex flex-wrap items-baseline justify-between gap-4">
        <h1 className="text-title font-display font-semibold">
          {query.search ? `Results for “${query.search}”` : "Shop"}
        </h1>
        {/* Announced, so a screen reader learns that a filter narrowed the set.
            The live region stays mounted across filters; only its content
            suspends, which is what makes the change audible. */}
        <p aria-live="polite" className="text-ui text-slate">
          <Suspense key={canonical} fallback={<Skeleton className="inline-block h-4 w-16" />}>
            <PieceCount query={query} />
          </Suspense>
        </p>
      </header>

      <div className="flex flex-col gap-10 md:flex-row md:gap-12">
        {/* Sticky under the header, which moves (--header-offset), with its own
            scroll once the category tree outgrows the viewport: the products
            scroll with the page, the filters stay put. */}
        <aside className="md:border-line md:scroll-quiet transition-[top] duration-450 ease-(--ease-settle) md:sticky md:top-[calc(var(--header-offset)+1.5rem)] md:max-h-[calc(100svh-var(--header-offset)-3rem)] md:w-60 md:shrink-0 md:self-start md:border-r md:pr-6">
          <h2 className="sr-only">Filters</h2>
          <FilterRail categories={categories} query={query} />
        </aside>

        <div className="flex-1">
          {/* Keyed on the canonical query, so every filter, sort or page is a
              new boundary and shows the grid's skeleton while it loads. Without
              the key a navigation within /products keeps the old results on
              screen, unchanged, until the new ones arrive. */}
          <Suspense key={canonical} fallback={<ProductGridSkeleton />}>
            <Results query={query} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

/**
 * Both this and `PieceCount` call `listProducts` with the same query. Next
 * deduplicates identical fetches within a render, so it is one request and one
 * cache key, not two (ADR 0001's budget is unchanged).
 */
async function Results({ query }: { query: ProductQuery }) {
  const page = await listProducts(query);

  if (page.results.length === 0) return <EmptyState query={query} />;

  return (
    <>
      <ProductGrid products={page.results} />
      <Pagination count={page.count} query={query} />
    </>
  );
}

async function PieceCount({ query }: { query: ProductQuery }) {
  const { count } = await listProducts(query);
  return count === 1 ? "1 piece" : `${count} pieces`;
}

/**
 * Three states, because they need three different answers.
 *
 * A filter combination matching nothing is a reachable, cacheable page, so this
 * is a real design surface rather than an edge case.
 */
function EmptyState({ query }: { query: ProductQuery }) {
  if (query.search) {
    return (
      <Panel title={`Nothing matches “${query.search}”`}>
        <p>
          Search looks for the words exactly as typed, anywhere in a name or a description. It does
          not correct spelling, so “tshirt” will not find “t-shirt”. A shorter word usually works
          better.
        </p>
        <Reset />
      </Panel>
    );
  }

  if (hasFilters(query)) {
    return (
      <Panel title="Nothing matches these filters">
        <p>Try removing one, or start again from everything.</p>
        <Reset />
      </Panel>
    );
  }

  // Not an error: the merchant has published nothing yet. A new deployment
  // lands here until someone fills the catalogue.
  return (
    <Panel title="The shop is not open yet">
      <p>There is nothing to buy here at the moment. Come back shortly.</p>
    </Panel>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-wash flex flex-col gap-4 border-t py-16">
      <h2 className="text-heading font-display font-semibold">{title}</h2>
      <div className="prose-body text-slate flex flex-col gap-4">{children}</div>
    </div>
  );
}

function Reset() {
  return (
    <p>
      <Link href="/products" className="decoration-indigo text-ink underline underline-offset-4">
        Show everything
      </Link>
    </p>
  );
}
