# Catalog browsing

Status: Implemented

Last updated: 2026-10-13

---

## Goal

Let a shopper browse, search, filter and sort the catalogue with the state in the
URL, server-rendered and cached, without letting crawlers or campaign links spend
the catalogue's per-IP request budget.

---

## Scope

What is included in this implementation?

- `/products`: the category band (no visible page header), the filter rail (a sheet
  below `lg`), sorting, search results, pagination and empty states, laid out as
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
  `skin_type` (each sorted, deduplicated, at most ten); prices matching a decimal pattern; `in_stock` and `on_sale` only as
  `true`; a known `ordering`; a trimmed search capped at 100 characters; whole-page
  offsets. `limit` is fixed at 25. `toCanonicalSearch` writes them in a fixed order;
  `toRequestedSearch` renders what arrived the same way, so the two compare.
  `hrefWith` builds every filter and page link, returning to page one on a filter
  change, under `/products` or a brand path. `withToggled` adds or removes one value
  of a repeatable filter; `appliedFilterCount` counts what the panel shows as
  applied; `isSaleOnly` is true when `on_sale` is the only filter (see
  [sale-prices.md](sale-prices.md)).
- `app/products/page.tsx` — redirects to the canonical URL when the request differs,
  then renders `ProductListing` with `ShopTitle` and the facets.
- `components/catalog/ShopTitle.tsx` — no visible page header (the image banner and
  then the title were removed at the client's request on 2026-10-13); only a
  visually hidden `h1`: the category's name, or "Shop", "Sale" when `isSaleOnly`, or
  "Results for …". The brand page keeps its image banner (`ListingHero`, see
  [brands.md](brands.md)).
- `components/catalog/CategoryBand.tsx` — the greige band: "Shop all" then the roots;
  inside a root, "Shop all" (the root, which includes its children) then its
  children. The applied one is underlined and `aria-current`. Links keep the other
  filters.
- `components/catalog/ProductListing.tsx` — the page header it is given, band, then from `lg` a 15rem
  filter rail on the left (an `aside` with a "Filters" heading) beside the results
  column. The rail is sticky under the header (`--header-offset`, eased with the
  header's slide), as tall as the viewport at most, and scrolls on its own with a thin
  scrollbar in the border colour (`scrollbar-thin` in `globals.css`) and
  `overscroll-contain`, so a wheel over the rail never scrolls the page and a wheel
  over the grid scrolls only the page. The column opens with a row: the Filters sheet trigger (below `lg` only)
  and the live product count on the left, the sort form on the right. Below it, the
  grid in a `Suspense` boundary keyed on the canonical query. Three empty states as before, plus "Nothing here
  is on sale right now" when `isSaleOnly`.
- `components/catalog/FilterPanel.tsx` — the filter groups stacked in one column:
  Skin type, Brand and Size as toggle-styled links, Shade as swatch links, Price
  bands, In stock only and On sale. "Clear filters" keeps the category, search and
  sort. Rendered twice by the listing, in the rail and in the sheet; only one is ever
  displayed.
- `components/catalog/FilterSheet.tsx` — below `lg`, an outline "Filters (n applied)"
  button opening the panel in a left `Sheet`, closed on arrival, with "Show results"
  to close it. No `"use client"` of its own: the Sheet parts carry the boundary.
- `components/catalog/SortForm.tsx` — the GET sort form: a native select and Apply,
  carrying every filter (skin types included) and the search as hidden inputs.
- `components/catalog/{ProductGrid,ProductCard,ProductGridSkeleton,Pagination}.tsx`
  — two columns, three from `md`, four from `xl` (the rail takes the room at `lg`),
  with hairline gutters; the card is centred: the image on
  a tinted 4:5 tile, the name, the brand, the price (`ProductPrice`: the sale price,
  the struck compare-at and the API's percent when on sale), and "Sold out" as a
  label.
- `lib/catalog/navigation.ts` — `listingFacets()` reads categories, brands, shades,
  sizes and skin types, each degrading to `[]`; `findCategory()` places a slug in
  the tree.
- `lib/catalog/listing.ts` — a `validation_error` from the product list (an unknown
  brand or skin type) is an empty result.

---

## Remaining

None. See the decision on the filter rail for what needs JavaScript.

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

### Decision: the facets sit in a left rail, and in a sheet on small screens

**Decision**

Categories are in the always-visible band; every other facet is in a rail on the left
of the grid from `lg`, always open. Below `lg` the same panel opens in a left `Sheet`
from a "Filters" button carrying the applied count. Sort sits above the grid, on the
right of the count.

**Reason**

Requested on 2026-10-13: the layout most shops use. It replaces the Filter and sort
`Popover` that dropped over the grid (2026-09-29), which itself replaced an in-flow
`Accordion`. The design has no rail; the deviation is recorded in
`design-alignment.md`.

**Consequence**

From `lg` the filters are server-rendered links again and **work without
JavaScript**, which the popover had given up. Below `lg`, **opening the sheet needs
JavaScript**: Radix does not render a closed dialog. Without it a shopper can still
browse by category, search, sort, paginate, and follow any filtered link. The sheet's
open state survives a filter click (same route, soft navigation), so several filters
can be applied in a row before "Show results". The grid loses a column at `lg` to the
rail and gets it back at `xl`.

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
- **The listing's `h1` is `sr-only` on purpose.** The header was removed from view
  by request, but the page still needs a level-one heading for screen readers and
  search; do not delete it.
- **The rail is a scroll box, so it clips what overflows it, focus outlines
  included.** Its `-ml-1 pl-1` keeps the left-hand links' outlines inside; do not
  "tidy" them away. The rail only sticks while the listing is on screen: on a short
  listing it leaves with the grid, as a sticky element does.
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
`min_price`, `max_price`, `in_stock`, `on_sale`, `search`, `ordering`, `offset`. React state:
only the sheet's open state, inside Radix.

---

## Accessibility

- The applied filter is marked with `aria-current`, not only styled.
- The product count is a polite live region that stays mounted across filters.
- Sorting has a visible Apply button, so it works before JavaScript loads.

---

## Tests

- `lib/catalog/query.test.ts` — allowlist, slugs, prices, flags, orderings, offsets,
  brands, skin types (parsing, dedupe, cap, canonical order, toggling),
  `appliedFilterCount`, idempotent canonicalisation, `hrefWith`, `on_sale` and
  `isSaleOnly`.
- `lib/catalog/listing.test.ts`, `lib/catalog/navigation.test.ts` (`findCategory`).
- `components/catalog/FilterPanel.test.tsx` — skin-type and brand toggles, shade and
  size links, the On sale link, clear filters, the brand page, empty groups.
- `components/catalog/FilterSheet.test.tsx` — closed on arrival with the applied
  count; opens as a dialog and closes from Show results.
- `components/catalog/SortForm.test.tsx` — the selected sort, the action path, every
  filter carried as hidden inputs.
- `components/catalog/CategoryBand.test.tsx` — roots, a root's children, the applied
  child, nothing on failure. `components/catalog/ProductCard.test.tsx` — including a
  sale and its accessible "Was".
- `tests/e2e/buy-flow.spec.ts` — filter by brand, shade and skin type.

---

## Files

```text
app/products/page.tsx
app/products/loading.tsx
components/catalog/
lib/catalog/{query,navigation,listing}.ts
public/images/listing.jpg
```
