import { listProducts } from "@/lib/api/catalog";
import { hasCode } from "@/lib/api/errors";
import type { Page, ProductQuery, ProductSummary } from "@/lib/api/types";

/**
 * Null when the API rejects the filters: it answers an unknown ?brand= slug,
 * from a stale link say, with a 400 rather than an empty page.
 */
export async function listingPage(query: ProductQuery): Promise<Page<ProductSummary> | null> {
  try {
    return await listProducts(query);
  } catch (error) {
    if (hasCode(error, "validation_error")) return null;
    throw error;
  }
}
