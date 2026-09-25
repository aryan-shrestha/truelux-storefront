# Storefront home

Status: Implemented

Last updated: 2026-09-25

---

## Goal

A home page that says what TrueLux is (authentic cosmetics, delivered across
Nepal, paid in cash on arrival) and gets a shopper into the catalogue by the three
routes cosmetics customers use: category, brand and what is new.

---

## Scope

What is included in this implementation?

- A hero with the headline, two calls to action and the shade ribbon
- The three promises: cash on delivery, authentic products, delivery across Nepal
- Shop by category (the first three root categories)
- New arrivals (the eight newest products)
- The brands strip
- An evening skincare ritual, the one editorial section

What is explicitly outside the scope?

- Merchant-editable content, a featured flag or campaigns: the API has none
- Real photography

---

## Context

The API has no home-page content. Creation order is the only editorial lever
(`ordering=-created_at`). Categories and brands come from the same reads the header
and the filter rail make.

---

## Implemented

- `app/page.tsx` — reads `latestProducts()`, `navigationCategories()` and
  `navigationBrands()` in parallel and composes the sections; canonical `/`.
- `components/home/Hero.tsx` — the headline in the display serif, the promise in
  one sentence, "Shop new arrivals" and "Browse brands", the shade ribbon, and the
  hero still life (`public/home/hero.svg`, `priority`).
- `components/home/Promises.tsx` — three promises with lucide icons in the gold
  accent.
- `components/home/CategoryShowcase.tsx` — up to three root categories, each on a
  generated still life (`still-life-serum.svg`, `still-life-palette.svg`,
  `still-life-perfume.svg`), linking to `/products?category=…`. Not rendered when
  there are no categories.
- `components/home/NewArrivals.tsx` — the eight newest in the listing's grid, with
  "Shop all new"; an `Empty` state when the catalogue is empty or unreachable.
- `components/home/BrandStrip.tsx` — every active brand's name in the display serif,
  linking to its page, between gold rules; not rendered when there are none.
- `components/home/Ritual.tsx` — cleanse, treat, moisturise: a real sequence, so
  numbered, each step linking to a search.
- `lib/catalog/latest.ts` — eight products, degrading to `[]` on an API failure.
- `public/home/*.svg` — generated still lifes replacing the clothing placeholders.

---

## Remaining

- Real photography for the hero, the category tiles and the ritual.
- Category tiles take the first three root categories in the merchant's order; the
  art is assigned by position, not by category. Needs photography or a category
  image field on the API.

---

## Decisions

### Decision: the home page never fails because the catalogue did

**Decision**

Every read on this page degrades to empty, and each section hides or shows its
empty state.

**Reason**

Every link to the shop points here, and a throttled API must not take it down.

**Consequence**

A fresh deployment shows the hero, the promises, "the shelves are being stocked"
and the ritual.

### Decision: new arrivals are a grid, not a carousel

**Decision**

Eight products in the listing's grid.

**Reason**

A carousel clips its items without JavaScript; the grid is complete on first paint.

**Consequence**

The carousel is used only for product photographs.

---

## Gotchas

- The ritual's steps link to searches ("cleanser", "serum", "moisturiser"), which
  are substring matches; "moisturiser" does not find "moisturizer".
- The SVG still lifes keep their light palette in dark mode.
- The category read here is the header's, deduplicated within the render; the brands
  read is the filter rail's and the sitemap's.

---

## Routes

```text
/     static, revalidated every 5 minutes (its shortest fetch); indexed
```

---

## API

### Calls

```text
GET /api/v1/products/?ordering=-created_at&limit=8    server, revalidate 300
GET /api/v1/categories/                               server, revalidate 3600
GET /api/v1/brands/                                   server, revalidate 3600
```

### Errors handled

| `code` | Treatment |
| --- | --- |
| any | The section's empty state, or the section is not rendered |

---

## Tests

- `app/page.test.tsx` — asks for the eight newest and renders them; categories link
  to their filter and brands to their pages; the three promises; the hero survives
  every read failing, with the empty state and without the category and brand
  sections.
- `lib/catalog/latest.test.ts`.

---

## Files

```text
app/page.tsx
components/home/
lib/catalog/latest.ts
public/home/
```
