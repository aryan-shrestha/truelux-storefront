import type { ProductOrdering, ProductQuery } from "@/lib/api/types";

// Every distinct query string is a cache key against the per-IP catalogue budget
// (ADR 0001), so anything not recognised here is dropped rather than forwarded.

export const PAGE_SIZE = 25;
const MAX_REPEATED = 10;

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

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function all(value: string | string[] | undefined): string[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

function slug(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  const trimmed = value.trim().toLowerCase();
  return SLUG.test(trimmed) && trimmed.length <= 50 ? trimmed : undefined;
}

function slugs(values: string[]): string[] | undefined {
  const valid = new Set<string>();
  for (const value of values) {
    const normalised = slug(value);
    if (normalised !== undefined) valid.add(normalised);
  }
  if (valid.size === 0) return undefined;
  return [...valid].sort().slice(0, MAX_REPEATED);
}

function price(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  return PRICE.test(trimmed) ? trimmed : undefined;
}

function flag(value: string | undefined): true | undefined {
  return value?.trim() === "true" ? true : undefined;
}

function ordering(value: string | undefined): ProductOrdering | undefined {
  const trimmed = value?.trim();
  return ORDERINGS.find((candidate) => candidate === trimmed);
}

function search(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (trimmed === undefined || trimmed === "") return undefined;
  return trimmed.slice(0, MAX_SEARCH_LENGTH);
}

function offset(value: string | undefined): number | undefined {
  if (value === undefined) return undefined;
  const parsed = Number(value.trim());
  if (!Number.isInteger(parsed) || parsed <= 0) return undefined;
  return parsed % PAGE_SIZE === 0 ? parsed : undefined;
}

/** `limit` is fixed at PAGE_SIZE: a client-chosen limit multiplies the reachable cache keys. */
export function toProductQuery(raw: RawSearchParams): ProductQuery {
  return {
    category: slug(first(raw.category)),
    brand: slugs(all(raw.brand)),
    size: slug(first(raw.size)),
    shade: slug(first(raw.shade)),
    skinType: slugs(all(raw.skin_type)),
    minPrice: price(first(raw.min_price)),
    maxPrice: price(first(raw.max_price)),
    inStock: flag(first(raw.in_stock)),
    search: search(first(raw.search)),
    ordering: ordering(first(raw.ordering)),
    offset: offset(first(raw.offset)),
    limit: PAGE_SIZE,
  };
}

export function toCanonicalSearch(query: ProductQuery): string {
  const params = new URLSearchParams();
  if (query.category) params.set("category", query.category);
  for (const brand of query.brand ?? []) params.append("brand", brand);
  if (query.size) params.set("size", query.size);
  if (query.shade) params.set("shade", query.shade);
  for (const skinType of query.skinType ?? []) params.append("skin_type", skinType);
  if (query.minPrice) params.set("min_price", query.minPrice);
  if (query.maxPrice) params.set("max_price", query.maxPrice);
  if (query.inStock) params.set("in_stock", "true");
  if (query.search) params.set("search", query.search);
  if (query.ordering) params.set("ordering", query.ordering);
  if (query.offset) params.set("offset", String(query.offset));
  return params.toString();
}

export function toRequestedSearch(raw: RawSearchParams): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    for (const item of all(value)) params.append(key, item);
  }
  return params.toString();
}

export function hasFilters(query: ProductQuery): boolean {
  return Boolean(
    query.category ??
    query.brand ??
    query.size ??
    query.shade ??
    query.skinType ??
    query.minPrice ??
    query.maxPrice ??
    query.inStock,
  );
}

/** For the repeatable filters, `?brand=` and `?skin_type=`. */
export function withToggled(current: string[] | undefined, value: string): string[] | undefined {
  const values = current ?? [];
  const next = values.includes(value)
    ? values.filter((slug) => slug !== value)
    : [...values, value].sort();
  return next.length === 0 ? undefined : next;
}

/** Changing a filter returns to page one: page 3 of a narrower result set is usually empty. */
export function hrefWith(
  query: ProductQuery,
  change: Partial<ProductQuery>,
  { keepOffset = false, pathname = "/products" } = {},
): string {
  const next = toCanonicalSearch({
    ...query,
    ...change,
    ...(keepOffset ? {} : { offset: undefined }),
  });
  return next === "" ? pathname : `${pathname}?${next}`;
}
