# Catalog browsing

Status: Implemented

Last updated: 2026-09-25

---

## Goal

Let a shopper browse, search, filter and sort the catalogue with the state in the
URL, server-rendered and cached, without letting crawlers or campaign links spend
the catalogue's per-IP request budget.

---

## Scope

What is included in this implementation?

- `/products`: the listing, its filter rail, sorting, search results, pagination and
  empty states
- The same listing under a brand, at `/brands/[slug]` (see [brands.md](brands.md))
- Filters: category (with children), brand (several), shade, size, price band, in
  stock only
- The search-parameter normaliser and the canonical redirect

What is explicitly outside the scope?

- Faceted counts, fuzzy search, infinite scroll (the API has none, or the budget
  forbids it)

---

## Context

`GET /api/v1/products/` with the parameters in
[backend-api.md](../integrations/backend-api.md#get-apiv1products). Every distinct
query string is a cache key against ADR 0001's budget, and catalogue state lives in
the URL (ADR 0004).

---

## Implemented

- `lib/catalog/query.ts` — `toProductQuery` keeps only known parameters with valid
  values: slugs for `category`, `size`, `shade`, and every valid `brand` (sorted,
  deduplicated, at most ten); prices matching a decimal pattern; `in_stock` only as
  `true`; a known `ordering`; a trimmed search capped at 100 characters; whole-page
  offsets. `limit` is fixed at 25. `toCanonicalSearch` writes them in a fixed order;
  `toRequestedSearch` renders what arrived the same way, so the two compare.
  `hrefWith` builds every filter and page link, returning to page one on a filter
  change, under `/products` or a brand path.
- `app/products/page.tsx` — redirects to the canonical URL when the request differs,
  then renders `ProductListing` with the facets.
- `components/catalog/ProductListing.tsx` — the page heading, a live product count,
  the sticky filter rail, and the grid in a `Suspense` boundary keyed on the
  canonical query, so every filter change shows the skeleton. Three empty states:
  a search with no match, filters with no match (with "Clear filters"), and an empty
  catalogue.
- `components/catalog/FilterRail.tsx` — groups in an `Accordion` that starts open:
  category and children as text links, brand and size as toggle-styled links, shade
  as swatch links, price bands, in stock only; a GET form with a `NativeSelect` for
  sorting that carries the other filters as hidden inputs.
- `components/catalog/{ProductGrid,ProductCard,ProductGridSkeleton,Pagination}.tsx`
  — the grid (the first row gets `priority`), the tile (brand, name, price, a
  "Sold out" badge, 4:5 on a tinted tile), the skeleton, and numbered shadcn
  pagination computed from `count` and `offset`.
- `lib/catalog/navigation.ts` — `listingFacets()` reads categories, brands, shades
  and sizes, each degrading to `[]`.
- `lib/catalog/listing.ts` — a `validation_error` from the product list (an unknown
  brand) is an empty result.

---

## Remaining

- Child-category filtering: `?category=` matches one category exactly, so a parent
  shows only what is attached to it. Needs a backend change.
- On a phone the filter rail sits, open, above the grid. A filter sheet would need
  JavaScript, which the filters deliberately do not.

---

## Decisions

### Decision: search parameters are normalised and the URL is canonicalised

**Decision**

Unknown or malformed parameters are dropped and the request is redirected to the
canonical URL.

**Reason**

Every query string is a cache key against 600 requests an hour.

**Consequence**

A hand-edited URL shows the shop, not an error; `?color=` from the clothing fork
redirects to the unfiltered listing.

### Decision: filters are links, not form controls

**Decision**

Every filter is a `next/link`, styled with shadcn variants where it looks like a
toggle.

**Reason**

They work without JavaScript, with middle-click and with the back button (ADR 0004).

**Consequence**

No `Checkbox` or `ToggleGroup` in the rail; see
[shadcn-foundation.md](shadcn-foundation.md).

### Decision: pagination is numbered links, price is fixed bands

**Decision**

No infinite scroll and no free price range.

**Reason**

Both would mint cache keys or move catalogue reads to the browser.

**Consequence**

Price bands are Under Rs 2,000, Rs 2,000 to 5,000, and Over Rs 5,000.

---

## Gotchas

- **Reading `searchParams` makes the route dynamic, and the budget still holds**:
  `fetch` with `revalidate` serves identical keys from the data cache.
- **`min_price` and `max_price` filter on `base_price`**, not the variant price.
- **`in_stock` on a product means some variant has stock.**
- **An unknown `?brand=` is a 400 from the API**, while an unknown `?category=`,
  `?size=` or `?shade=` is an empty page. `listingPage` makes both read as "nothing
  matches".
- **The shade and size facets list only values in use**, so a shade can disappear
  from the rail while a link still carries it.
- **The API's `next` and `previous` carry the server's own host.** Pagination never
  renders them.
- **`ordering` is silently ignored by the API when invalid**, which is why the
  normaliser drops it.

---

## Routes

```text
/products            dynamic (searchParams); the unfiltered URL is indexed;
                     /products? is disallowed in robots.txt
```

---

## API

### Calls

```text
GET /api/v1/products/        server, revalidate 300 (one key per canonical query)
GET /api/v1/categories/      server, revalidate 3600
GET /api/v1/brands/          server, revalidate 3600
GET /api/v1/shades/          server, revalidate 3600
GET /api/v1/sizes/           server, revalidate 3600
```

### Errors handled

| `code` | Treatment |
| --- | --- |
| `validation_error` on `products/` | The "nothing matches these filters" state |
| any, on a facet list | That group is not rendered |
| any other, on `products/` | The error boundary |

---

## State and data

URL only: `category`, `brand` (repeated), `size`, `shade`, `min_price`, `max_price`,
`in_stock`, `search`, `ordering`, `offset`.

---

## Accessibility

- The applied filter is marked with `aria-current`, not only styled.
- The product count is a polite live region that stays mounted across filters.
- Sorting has a visible Apply button, so it works before JavaScript loads.

---

## Tests

- `lib/catalog/query.test.ts` — allowlist, slugs, prices, flags, orderings, offsets,
  brands, idempotent canonicalisation, `hrefWith`.
- `lib/catalog/listing.test.ts`, `lib/catalog/navigation.test.ts`.
- `components/catalog/FilterRail.test.tsx`, `components/catalog/ProductCard.test.tsx`.
- `tests/e2e/buy-flow.spec.ts` — browse and filter by brand and shade.

---

## Files

```text
app/products/page.tsx
app/products/loading.tsx
components/catalog/
lib/catalog/{query,navigation,listing}.ts
```
