import { listProducts } from "@/lib/api/catalog";
import { ApiError, ApiUnreachableError } from "@/lib/api/errors";
import type { ProductSummary } from "@/lib/api/types";

const LATEST_COUNT = 9;

/**
 * The home page's product sequence, degrading to nothing when the API fails.
 *
 * Every link to the shop points at the home page, so a throttled or unreachable
 * catalogue must not take it down: the hero still renders and the sequence is
 * replaced by the not-open-yet copy. Anything that is not an API failure is a
 * bug and still reaches the error boundary.
 *
 * Creation order is the only editorial lever the API offers — there is no
 * featured flag — so the newest garments are the drop.
 */
export async function latestProducts(): Promise<ProductSummary[]> {
  try {
    const page = await listProducts({ ordering: "-created_at", limit: LATEST_COUNT });
    return page.results;
  } catch (error) {
    if (error instanceof ApiError || error instanceof ApiUnreachableError) return [];
    throw error;
  }
}
