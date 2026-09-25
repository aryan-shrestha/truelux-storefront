# Brands

Status: Planned

Last updated: 2026-09-25

---

## Goal

Let shoppers browse and filter TrueLux's catalogue by brand, the way cosmetics
customers actually shop.

---

## Scope

What is included in this implementation?

- A **Brand** filter group in `FilterRail`, multi-select, stored in the URL as
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

## Tests

To be written:

- The query parser round-trips several brands and drops unknown shapes.
- `FilterRail` renders brand links with the right `href` and active state.
- `ProductCard` shows the brand.
- The brand page renders the header and calls the listing with the brand filter.
