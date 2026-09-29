import { listProducts, listRelatedProducts } from "@/lib/api/catalog";
import { ApiError, ApiUnreachableError } from "@/lib/api/errors";
import type { Page, Product, ProductSummary } from "@/lib/api/types";

const RAIL_LENGTH = 8;

// A rail is decoration around the page's real content, so a failed read shows
// no rail rather than taking the page to its error boundary.
async function orNone(read: () => Promise<Page<ProductSummary>>): Promise<ProductSummary[]> {
  try {
    return (await read()).results;
  } catch (error) {
    if (error instanceof ApiError || error instanceof ApiUnreachableError) return [];
    throw error;
  }
}

/** The API has no featured flag, so creation order is the home page's only editorial lever. */
export function latestProducts(): Promise<ProductSummary[]> {
  return orNone(() => listProducts({ ordering: "-created_at", limit: RAIL_LENGTH }));
}

export function saleProducts(): Promise<ProductSummary[]> {
  return orNone(() => listProducts({ onSale: true, limit: RAIL_LENGTH }));
}

/** A root's slug includes its children, so this is the whole branch. */
export function categoryProducts(category: string): Promise<ProductSummary[]> {
  return orNone(() => listProducts({ category, limit: RAIL_LENGTH }));
}

/** Other products from the same category; one extra is asked for because this one is dropped. */
export async function relatedProducts(product: Product): Promise<ProductSummary[]> {
  const products = await orNone(() =>
    listRelatedProducts({ category: product.category.slug, limit: RAIL_LENGTH + 1 }),
  );
  return products.filter((candidate) => candidate.id !== product.id).slice(0, RAIL_LENGTH);
}
