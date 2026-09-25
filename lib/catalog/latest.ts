import { listProducts } from "@/lib/api/catalog";
import { ApiError, ApiUnreachableError } from "@/lib/api/errors";
import type { ProductSummary } from "@/lib/api/types";

const LATEST_COUNT = 8;

/** The API has no featured flag, so creation order is the home page's only editorial lever. */
export async function latestProducts(): Promise<ProductSummary[]> {
  try {
    const page = await listProducts({ ordering: "-created_at", limit: LATEST_COUNT });
    return page.results;
  } catch (error) {
    if (error instanceof ApiError || error instanceof ApiUnreachableError) return [];
    throw error;
  }
}
