# Catalog browsing

Status: Implemented

Last updated: 2026-09-26

---

## Goal

Let a shopper browse, search, filter and sort the catalogue with the state in the
URL, server-rendered and cached, without letting crawlers or campaign links spend
the catalogue's per-IP request budget.

---

## Scope

What is included in this implementation?

- `/products`: the listing hero, the category band, the Filter and sort panel,
  sorting, search results, pagination and empty states, laid out as
  `Product-Listing---desktop-1..3.png` ([design-alignment.md](design-alignment.md))
- The same listing under a brand, at `/brands/[slug]` (see [brands.md](brands.md))
- Filters: category (a root includes its children), skin type (several), brand
  (several), shade, size, price band, in stock only
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
  values: slugs for `category`, `size`, `shade`, and every valid `brand` and
  `skin_type` (each sorted, deduplicated, at most ten); prices matching a decimal pattern; `in_stock` only as
  `true`; a known `ordering`; a trimmed search capped at 100 characters; whole-page
  offsets. `limit` is fixed at 25. `toCanonicalSearch` writes them in a fixed order;
  `toRequestedSearch` renders what arrived the same way, so the two compare.
  `hrefWith` builds every filter and page link, returning to page one on a filter
  change, under `/products` or a brand path. `withToggled` adds or removes one value
  of a repeatable filter; `appliedFilterCount` counts what the panel shows as
  applied.
- `app/products/page.tsx` — redirects to the canonical URL when the request differs,
  then renders `ProductListing` with `ShopHero` and the facets.
- `components/catalog/ShopHero.tsx` + `ListingHero.tsx` — a full-bleed band on
  `public/art/listing.svg` with a scrim: the category's name (or "Shop", or "Results
  for …"), a line of copy, and a Shop › root breadcrumb inside a category.
- `components/catalog/CategoryBand.tsx` — the greige band: "Shop all" then the roots;
  inside a root, "Shop all" (the root, which includes its children) then its
  children. The applied one is underlined and `aria-current`. Links keep the other
  filters.
- `components/catalog/ProductListing.tsx` — hero, band, then the Filter and sort
  panel with a live product count on its row, and the grid in a `Suspense` boundary
  keyed on the canonical query. Three empty states as before.
- `components/catalog/FilterPanel.tsx` — one `Accordion` item, "Filter and sort (n
  applied)", open whenever a filter or sort is applied and closed otherwise. Inside,
  in up to four columns: Skin type, Brand and Size as toggle-styled links, Shade as
  swatch links, Price bands, In stock only, and the GET sort form carrying every
  filter (skin types included) as hidden inputs. "Clear filters" keeps the category,
  search and sort.
- `components/catalog/{ProductGrid,ProductCard,ProductGridSkeleton,Pagination}.tsx`
  — four columns from `lg` with hairline gutters; the card is centred: the image on
  a tinted 4:5 tile, the name, the brand, the price, and "Sold out" as a label.
- `lib/catalog/navigation.ts` — `listingFacets()` reads categories, brands, shades,
  sizes and skin types, each degrading to `[]`; `findCategory()` places a slug in
  the tree.
- `lib/catalog/listing.ts` — a `validation_error` from the product list (an unknown
  brand or skin type) is an empty result.

---

## Remaining

None. See the decision on the closed panel for what now needs JavaScript.

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

### Decision: the facets sit in a panel that is closed until something is applied

**Decision**

Categories are in the always-visible band; every other facet is in a Filter and sort
`Accordion` that is open whenever a filter or sort is applied and closed otherwise.

**Reason**

The design has no filter rail: a full-width four-column grid under a category band.
Opening the panel whenever something is applied keeps what narrowed the grid in view.

**Consequence**

The filters are still links, but **opening the closed panel needs JavaScript**:
Radix does not render closed content. Without it a shopper can still browse by
category, search, paginate, and follow any filtered link. This relaxes the old
"the whole rail works without JavaScript" property and is recorded as a deviation
in `design-alignment.md`.

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
- **An unknown `?brand=` or `?skin_type=` is a 400 from the API**, while an unknown
  `?category=`, `?size=` or `?shade=` is an empty page. `listingPage` makes both
  read as "nothing matches".
- **`?category=<root>` includes the root's children** (backend `skin-types.md`); a
  child's slug matches only that child. "Shop all" in the band and the menus relies
  on this.
- **The shade, size and skin-type facets list only values in use**, so a value can
  disappear from the panel while a link still carries it.
- `toggleVariants()` is called without `cn` on filter links, so a variant's radius
  must not fight the base class: the radius lives in each variant.
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
GET /api/v1/products/        server, revalidate 600 (one key per canonical query)
GET /api/v1/categories/      server, revalidate 3600
GET /api/v1/brands/          server, revalidate 3600
GET /api/v1/shades/          server, revalidate 3600
GET /api/v1/sizes/           server, revalidate 3600
GET /api/v1/skin-types/      server, revalidate 3600
```

### Errors handled

| `code` | Treatment |
| --- | --- |
| `validation_error` on `products/` | The "nothing matches these filters" state |
| any, on a facet list | That group is not rendered |
| any other, on `products/` | The error boundary |

---

## State and data

URL only: `category`, `brand` (repeated), `size`, `shade`, `skin_type` (repeated),
`min_price`, `max_price`, `in_stock`, `search`, `ordering`, `offset`. React state:
only the panel's open state.

---

## Accessibility

- The applied filter is marked with `aria-current`, not only styled.
- The product count is a polite live region that stays mounted across filters.
- Sorting has a visible Apply button, so it works before JavaScript loads.

---

## Tests

- `lib/catalog/query.test.ts` — allowlist, slugs, prices, flags, orderings, offsets,
  brands, skin types (parsing, dedupe, cap, canonical order, toggling),
  `appliedFilterCount`, idempotent canonicalisation, `hrefWith`.
- `lib/catalog/listing.test.ts`, `lib/catalog/navigation.test.ts` (`findCategory`).
- `components/catalog/FilterPanel.test.tsx` — closed and open states, skin-type and
  brand toggles, shade and size links, clear filters, hidden inputs, the brand page.
- `components/catalog/CategoryBand.test.tsx` — roots, a root's children, the applied
  child, nothing on failure. `components/catalog/ProductCard.test.tsx`.
- `tests/e2e/buy-flow.spec.ts` — filter by brand, shade and skin type.

---

## Files

```text
app/products/page.tsx
app/products/loading.tsx
components/catalog/
lib/catalog/{query,navigation,listing}.ts
public/art/listing.svg
```
