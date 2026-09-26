# Brands

Status: Implemented

Last updated: 2026-09-26

---

## Goal

Let shoppers browse and filter TrueLux's catalogue by brand, the way cosmetics
customers actually shop.

---

## Scope

What is included in this implementation?

- A **Brand** filter group in `FilterPanel`, multi-select, stored in the URL as
  repeated `?brand=` parameters (ADR 0004)
- The brand name on `ProductCard` and above the product title on product detail,
  linking to the brand page
- `/brands`: every active brand as a grid of cards (logo or wordmark fallback, name,
  product count)
- `/brands/[slug]`: brand header (logo, name, description) above the standard
  product listing, pre-filtered to that brand. It reuses the `/products` listing
  components, not a copy of them.
- A "Brands" entry in the header navigation (`site-links.ts`) and a brands strip on
  the home page
- Brand pages in `sitemap.ts` with metadata

What is explicitly outside the scope?

- Brand-specific theming
- Brand search suggestions

---

## Context

Backend contract: `GET /api/v1/brands/`, `GET /api/v1/brands/{slug}/`, and `brand` on
every product item, with `?brand=` repeatable. See
`docs/integrations/backend-api.md` and the backend's `docs/features/brands.md`. An
unknown or inactive brand returns 404, which renders `not-found.tsx`.

---

## Planned

- `lib/api/types.ts`: `Brand`, `BrandSummary`, and `brand` on `ProductListItem`.
- `lib/api/catalog.ts`: `listBrands()` and `getBrand(slug)`, server-side, cached the
  way categories are.
- `lib/catalog/query.ts`: `brand` is a string array in `ProductQuery`; parsing and
  normalising follow the existing `category` handling.
- Every control is a shadcn component (ADR 0009). The filter group uses `Checkbox`
  plus links, or `ToggleGroup`, and must still work without JavaScript as links.

---

## Implemented

- `lib/api/types.ts` — `BrandRef` (`name`, `slug`), `Brand` (adds `description`,
  `logoUrl`, `productCount`), and `brand` on `ProductSummary`.
- `lib/api/catalog.ts` — `listBrands()` and `getBrand({ slug })`, server-side, at
  `revalidate: 3600`; relative logo URLs are resolved against the API like product
  images. `listProducts` sends `brand` as a repeated parameter.
- `lib/api/client.ts` — an array query value is appended once per item.
- `lib/catalog/query.ts` — `brand` is a string array: every valid slug is kept,
  deduplicated, sorted and capped at ten; `withBrandToggled` adds or removes one;
  `hasFilters` counts it.
- `lib/catalog/navigation.ts` — `navigationBrands()` and `listingFacets()` degrade to
  `[]` when a read fails.
- `lib/catalog/listing.ts` — `listingPage` returns `null` when the API rejects the
  filters with `validation_error`.
- `components/catalog/FilterPanel.tsx` — a Brand group of toggle-styled links, each
  adding or removing its brand; the applied ones carry `aria-current`.
- `components/catalog/ProductCard.tsx` — the brand name, linking to its page, below
  the product name. The product link stretches over the tile; the brand link sits
  above it, because anchors cannot nest.
- `app/products/[slug]/page.tsx` — the brand below the title, linking to the brand
  page; the page title is "{product} by {brand}".
- `components/catalog/ProductListing.tsx` — the listing shared by `/products` and
  the brand page: hero, category band, count, Filter and sort panel, grid,
  pagination and empty states.
- `app/brands/page.tsx` — every active brand as a `Card` (`components/brands/BrandCard.tsx`)
  with the logo or a wordmark fallback, the name and the product count.
- `app/brands/[slug]/page.tsx` — a `ListingHero` with the logo on a light tile, a
  Brands link, the name and the description (or "Every {brand} product we stock"),
  above `ProductListing` with `lockedBrand`; `notFound()` on `not_found`;
  `generateMetadata` with a canonical URL and the logo as the Open Graph image.
- `components/layout/site-links.ts` — "Brands" in the header, the mobile menu and
  the footer. `components/home/BrandGrid.tsx` — up to six brand tiles on the home page.
- `app/sitemap.ts` — `/brands` and every brand page. `app/robots.ts` — allows
  `/brands`, disallows `/brands/*?`.

---

## Remaining

None.

---

## Decisions

### Decision: the brand page reuses the listing, with the brand in the path only

**Decision**

`/brands/{slug}` renders `ProductListing` with `lockedBrand`, which adds the brand to
the API query but not to the URL. A `?brand=` on a brand page is dropped by the
canonical redirect, and the Brand filter group is hidden there.

**Reason**

One listing implementation, and one canonical URL per view (ADR 0004): otherwise
`/brands/lumiere?brand=verde` would be a second address for a nonsensical view.

**Consequence**

Filter and pagination links on a brand page are built under its own path
(`hrefWith(..., { pathname })`).

### Decision: an unknown `?brand=` is an empty result, not an error page

**Decision**

`listingPage` turns the API's `400 validation_error` into "nothing matches these
filters".

**Reason**

The backend validates brand slugs (an unknown one is a 400; see its `brands.md`
Gotchas), and a stale or hand-edited link is a normal state, not a failure.

**Consequence**

Any other failure still reaches the error boundary.

### Decision: at most ten brands in a query

**Decision**

`toProductQuery` keeps the first ten sorted brand slugs.

**Reason**

Every combination is a cache key against the catalogue budget (ADR 0001); an
unbounded list lets a URL mint keys without limit.

**Consequence**

An eleventh brand in a URL is silently dropped by the canonical redirect.

---

## Gotchas

- The API's `?brand=` is a union: two brands show both, not their intersection.
- An inactive brand's products disappear from every endpoint and fail checkout
  with `variant_unavailable`, so a cart can hold a line that no page shows.
- `product_count` counts published products, not stock; a brand whose products are
  all sold out still shows its count.

---

## Routes

```text
/brands              static, revalidated hourly with the brands list; indexed
/brands/[slug]       dynamic (reads searchParams); the unfiltered page is indexed,
                     filtered variants are disallowed in robots.txt
```

---

## API

### Calls

```text
GET /api/v1/brands/              server, revalidate 3600
GET /api/v1/brands/{slug}/       server, revalidate 3600
GET /api/v1/products/?brand=…    server, revalidate 600
```

### Errors handled

| `code` | Treatment |
| --- | --- |
| `not_found` on `brands/{slug}/` | `notFound()` |
| `validation_error` on `products/` | The listing's empty state |
| any, on `brands/` | `navigationBrands()` returns `[]`: no strip, no group, an empty brands page |

---

## Tests

- `lib/catalog/query.test.ts` — several brands round-trip through the canonical
  search, invalid slugs are dropped, the list is capped at ten, a brand toggles.
- `lib/api/catalog.test.ts` — `brand` is mapped on items, `?brand=` repeats,
  `listBrands` and `getBrand` map the payload and resolve a relative logo.
- `lib/api/client.test.ts` — an array query value repeats.
- `lib/catalog/listing.test.ts` — `validation_error` becomes no results; other
  failures propagate.
- `lib/catalog/navigation.test.ts` — the brand list and facets degrade to `[]`.
- `components/catalog/FilterPanel.test.tsx` — brand links add and remove with the
  right `href` and `aria-current`; the group is hidden on a brand page.
- `components/catalog/ProductCard.test.tsx` — the brand links to its page.
- `app/brands/[slug]/page.test.tsx` — the header renders, the listing is locked to
  the brand, `?brand=` redirects away, a 404 renders not-found.
- `app/sitemap.test.ts`, `app/robots.test.ts`, `app/page.test.tsx`.

---

## Files

```text
app/brands/
components/brands/BrandCard.tsx
components/catalog/{FilterPanel,ProductCard,ProductListing}.tsx
components/home/BrandGrid.tsx
lib/api/{catalog,client,types}.ts
lib/catalog/{query,navigation,listing}.ts
```
