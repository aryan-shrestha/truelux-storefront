import { listCategories } from "@/lib/api/catalog";
import type { Category } from "@/lib/api/types";

/**
 * The category tree for navigation, degrading to nothing when the API fails.
 *
 * **One of two places in the storefront that swallow an `ApiError`**, the other
 * being the home page's `latestProducts`. The header renders on every route and
 * the listing's filter rail on the busiest one; neither is worth taking a page
 * down for. Everything else lets the error reach a boundary.
 *
 * It lives here rather than in either consumer because both need it, and a
 * second copy is a second answer to "what happens when categories fail" that
 * nobody would notice drifting.
 */
export async function navigationCategories(): Promise<Category[]> {
  try {
    return await listCategories();
  } catch {
    return [];
  }
}
