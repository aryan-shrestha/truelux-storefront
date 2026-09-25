import type { ProductOrdering, ProductQuery } from "@/lib/api/types";

/**
 * Normalises the listing's search parameters.
 *
 * Every distinct query string is a distinct cache key, and cache keys are the
 * numerator of [ADR 0001]'s request budget: the backend allows 600 catalogue
 * requests an hour per IP, and a deployed storefront is one IP. Without this,
 * the set of reachable cache keys is whatever a crawler, a campaign link or a
 * bored visitor produces, and `?utm_source=` alone mints one per value.
 *
 * With it, the reachable keys are bounded by the merchant's own categories,
 * sizes and colours — a number that can be checked against the budget.
 *
 * An invalid value is **dropped, not rejected**. Someone who hand-edits a URL
 * sees the shop, not an error.
 */

export const PAGE_SIZE = 25;

const ORDERINGS: readonly ProductOrdering[] = [
  "name",
  "-name",
  "base_price",
  "-base_price",
  "created_at",
  "-created_at",
];

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const PRICE = /^\d{1,8}(?:\.\d{1,2})?$/;
const MAX_SEARCH_LENGTH = 100;

export type RawSearchParams = Record<string, string | string[] | undefined>;

/** A repeated parameter keeps its first value; the API accepts only one anyway. */
function first(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function slug(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  const trimmed = value.trim().toLowerCase();
  return SLUG.test(trimmed) && trimmed.length <= 50 ? trimmed : undefined;
}

function price(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  return PRICE.test(trimmed) ? trimmed : undefined;
}

/** Only the exact string "true". Anything else, including "false", means unset. */
function flag(value: string | undefined): true | undefined {
  return value?.trim() === "true" ? true : undefined;
}

function ordering(value: string | undefined): ProductOrdering | undefined {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  // The API silently ignores an ordering it does not recognise, so a typo would
  // otherwise produce the default order with nothing to say why.
  return ORDERINGS.find((candidate) => candidate === trimmed);
}

function search(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (trimmed === undefined || trimmed === "") return undefined;
  return trimmed.slice(0, MAX_SEARCH_LENGTH);
}

/** Pages are whole pages: an arbitrary offset is a cache key with no new content. */
function offset(value: string | undefined): number | undefined {
  if (value === undefined) return undefined;
  const parsed = Number(value.trim());
  if (!Number.isInteger(parsed) || parsed <= 0) return undefined;
  return parsed % PAGE_SIZE === 0 ? parsed : undefined;
}

/**
 * The allowlist is these nine reads and nothing else: a parameter not named
 * here cannot reach the API or the cache key.
 *
 * `limit` is deliberately not among them. It is fixed at PAGE_SIZE, because
 * letting a client choose it would multiply the reachable cache keys by every
 * integer someone cares to type.
 */
export function toProductQuery(raw: RawSearchParams): ProductQuery {
  return {
    category: slug(first(raw.category)),
    size: slug(first(raw.size)),
    color: slug(first(raw.color)),
    minPrice: price(first(raw.min_price)),
    maxPrice: price(first(raw.max_price)),
    inStock: flag(first(raw.in_stock)),
    search: search(first(raw.search)),
    ordering: ordering(first(raw.ordering)),
    offset: offset(first(raw.offset)),
    limit: PAGE_SIZE,
  };
}

/**
 * The canonical query string for a normalised query: a fixed field order, and
 * nothing absent. Two differently-ordered equivalent URLs produce one key.
 */
export function toCanonicalSearch(query: ProductQuery): string {
  const params = new URLSearchParams();
  if (query.category) params.set("category", query.category);
  if (query.size) params.set("size", query.size);
  if (query.color) params.set("color", query.color);
  if (query.minPrice) params.set("min_price", query.minPrice);
  if (query.maxPrice) params.set("max_price", query.maxPrice);
  if (query.inStock) params.set("in_stock", "true");
  if (query.search) params.set("search", query.search);
  if (query.ordering) params.set("ordering", query.ordering);
  if (query.offset) params.set("offset", String(query.offset));
  return params.toString();
}

/** What the visitor actually sent, rendered the same way, so the two compare. */
export function toRequestedSearch(raw: RawSearchParams): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    const single = first(value);
    if (single !== undefined) params.append(key, single);
  }
  return params.toString();
}

/** True when a filter is applied — which is what the empty states branch on. */
export function hasFilters(query: ProductQuery): boolean {
  return Boolean(
    query.category ??
    query.size ??
    query.color ??
    query.minPrice ??
    query.maxPrice ??
    query.inStock,
  );
}

/**
 * A link to the listing with one parameter changed, used by every filter and by
 * pagination. Setting a filter always returns to page one: staying on page 3 of
 * a narrower result set lands on an empty page.
 */
export function hrefWith(
  query: ProductQuery,
  change: Partial<ProductQuery>,
  { keepOffset = false } = {},
): string {
  const next = toCanonicalSearch({
    ...query,
    ...change,
    ...(keepOffset ? {} : { offset: undefined }),
  });
  return next === "" ? "/products" : `/products?${next}`;
}
