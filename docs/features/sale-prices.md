# Sale prices

Status: Implemented

Last updated: 2026-09-29

---

## Goal

Make sales visible and easy to find. A product on sale shows what the customer
pays, the struck-through "was" price and the saving, and one place lists
everything on sale.

---

## Scope

What is included in this implementation?

- **Product card:** when on sale, it shows `sale_price`, then `compare_at_price`
  struck through (`<s>` with a visually hidden "Was"), and a "−15%" shadcn
  `Badge` built from `discount_percent`. Not on sale, the card is unchanged and
  shows `base_price`.
- **Product detail:** the price block follows the selected variant (its `price`,
  plus its compare-at and badge when the variant is on sale); before a variant is
  chosen it uses the product-level sale, as the card does; a variant not on sale
  shows no struck price and no badge. On-sale size and shade options carry a small
  "Sale" marker.
- **Listing filter:** "On sale" in the filter panel's Availability group, as
  `?on_sale=true`, a link like every other filter, through the URL normaliser.
- **Navigation:** "Sale" in the header's menu and the mobile menu, to
  `/products?on_sale=true`. The listing's hero reads "Sale" when that is the only
  filter applied.
- **Home:** an "On sale" rail on the existing `ProductRail`, reading
  `?on_sale=true&limit=8`, hidden when nothing is on sale.
- **Bag and checkout:** unchanged. The bag line keeps the variant's `price`, which
  is the sale price, and the quote prices from `price`.
- `lib/api/types.ts`, `lib/api/catalog.ts` and
  [backend-api.md](../integrations/backend-api.md) carry the new fields.

What is explicitly outside the scope?

- Countdown timers and "ends soon" copy. The API has no sale dates.
- Any percentage or saving computed in the storefront. `discount_percent` comes
  from the API, and money stays a string (ADR 0003).
- Sorting or price-filtering by the sale price. `ordering=base_price`,
  `min_price` and `max_price` read `base_price` on the backend.

---

## Context

- Backend contract: `../back-end/docs/features/sale-prices.md` and back-end
  [ADR 0018](../../../back-end/docs/decisions/0018-a-sale-is-a-compare-at-price.md):
  a sale is a variant's `compare_at_price` above its resolved `price`.
- Every component is shadcn (ADR 0009); light only (ADR 0012). No component was
  added; `badge.tsx` gained one variant with no `dark:` classes.
- The two new listing keys are counted in `architecture.md`'s request budget.

---

## Implemented

- `lib/api/types.ts` — `Sale` (`compareAtPrice`, `discountPercent`),
  `ProductSale` (`Sale` plus `price`), `sale: Sale | null` on `ProductVariant`,
  `sale: ProductSale | null` on `ProductSummary`, and `onSale` on `ProductQuery`.
- `lib/api/catalog.ts` — `toSale` builds a sale only when `on_sale` is true and
  its figures are present, so a variant's stale compare-at (returned with
  `on_sale: false`) is dropped; `toProductSale` adds `sale_price`. `listProducts`
  sends `on_sale`.
- `components/catalog/ProductPrice.tsx` — the price alone when there is no sale;
  otherwise the price, the compare-at in `<s>` in the muted colour with a
  visually hidden "Was ", and a `Badge variant="sale"` whose visible "−15%" is
  `aria-hidden` beside a visually hidden "15% off". It wraps onto a second line
  on a narrow card.
- `components/ui/badge.tsx` — `sale`: a hairline charcoal outline on the page
  colour with charcoal tabular figures. No red, matching the mockups' quiet
  "BESTSELLER" label.
- `components/catalog/ProductCard.tsx` — `ProductPrice` with `sale.price`, or
  `basePrice` when not on sale.
- `components/catalog/VariantPicker.tsx` — the live price block renders
  `ProductPrice` for the selected variant, or for the product's sale before one is
  chosen. `SaleMarker` is an `aria-hidden` "Sale" badge inside a size toggle, and
  at a swatch's top-right corner. The option's accessible name gains "On sale".
- `lib/catalog/variants.ts` — options carry `onSale` (any matching variant has a
  sale, under the other current choice); `statusOf` returns "On sale" for an
  available on-sale option, and "Sold out" / "Not available…" still win.
- `lib/catalog/query.ts` — `on_sale` parsed as a flag (only `true`), written after
  `in_stock` in the canonical order, counted by `hasFilters` and
  `appliedFilterCount`; `isSaleOnly(query)` is true when `on_sale` is the only
  filter and there is no category or search (sort and page allowed).
- `components/catalog/FilterPanel.tsx` — the "On sale" toggle link, and the hidden
  `on_sale` input in the sort form.
- `components/catalog/ShopHero.tsx` — title "Sale" and its own line when
  `isSaleOnly`.
- `components/catalog/ProductListing.tsx` — `isSaleOnly` with no results is
  "Nothing here is on sale right now", with "See everything".
- `components/layout/site-links.ts` — `SALE_LINK`; `ShopMenu.tsx` renders it
  between Brands and Journal, and `MobileNav.tsx` on its first panel in the same
  place.
- `lib/catalog/rails.ts` — `saleProducts()`, eight on sale, `[]` on failure.
- `app/page.tsx` — reads it with the other home reads and renders the "On sale"
  rail after the category rail, linking to "Everything on sale".

---

## Remaining

None.

---

## Decisions

### Decision: the sale is one nullable object, not four loose fields

**Decision**

`lib/api` maps `on_sale`, `sale_price`, `compare_at_price` and
`discount_percent` to `sale: { price, compareAtPrice, discountPercent } | null`
(and the variant's three to `sale: { compareAtPrice, discountPercent } | null`).

**Reason**

The API promises the figures are null exactly when `on_sale` is false. One
nullable object makes that the type, so no component can render a badge without
a percent, and the variant's stale compare-at cannot be mistaken for a sale.

**Consequence**

Components test `sale === null`, never `onSale`. The raw compare-at of a variant
not on sale is not available to the UI, which has no use for it.

### Decision: sale styling is restrained

**Decision**

Struck price in the muted colour, a hairline outline badge in charcoal, no red,
and no badge over the photograph.

**Reason**

The client's mockups (`docs/design/renders/`) mark products with a small quiet
label, not colour. The image corner is already the "Sold out" label's place.

**Consequence**

A sale does not rely on colour: the strike, the badge text and the screen-reader
"Was" / "% off" each carry it.

---

## Gotchas

- **`discount_percent` is floored by the API**, so a badge can read 14% where the
  arithmetic gives 14.9. Do not "fix" it here.
- **The card's sale price may not be the cheapest variant.** It is the API's
  sale variant: the lowest-priced variant *on sale*. A cheaper full-price variant
  can exist.
- **A product on sale filters and sorts by `base_price`**, so "Under Rs 2,000"
  can hide a product whose sale price is under 2,000.
- **The live backend rejects any `on_sale` value other than `true`/`false`** with
  `400 validation_error`; the normaliser only ever forwards `true`.
- The `Sale` marker on a swatch overhangs the swatch's top-right; its opaque page
  background keeps it legible over the swatch ring and the selected size toggle's
  dark fill.

---

## Routes

```text
/products?on_sale=true   the listing, server-rendered; disallowed in robots.txt and canonical to /products, like every filtered view
```

No new route.

---

## API

### Calls

```text
GET /api/v1/products/?on_sale=true&limit=25   server, revalidate 600 (header's Sale)
GET /api/v1/products/?on_sale=true&limit=8    server, revalidate 600 (home rail)
```

The sale fields arrive on the existing list and detail reads.

### Errors handled

| `code` | Treatment |
| --- | --- |
| any, on the home rail | The rail is not rendered |
| `validation_error` on the listing | The listing's empty state, as before |

---

## State and data

URL only: `on_sale=true`. No storage change: the bag line's `unitPrice` was
already the variant's `price`.

---

## Accessibility

- The struck price reads "Was Rs 3,200", because `<s>` is not announced.
- The badge reads "15% off" rather than "minus fifteen percent".
- The "Sale" marker on an option is `aria-hidden`; the option's name carries
  "On sale" instead, and still contains the visible word.
- The applied "On sale" filter is `aria-current`, like every filter.

---

## Tests

- `lib/api/catalog.test.ts` — product sale mapped as sent and `?on_sale=true`
  sent; no `on_sale` unless asked; a variant's sale, and a stale compare-at with
  `on_sale: false` mapped to none.
- `components/catalog/ProductCard.test.tsx` — sale price, struck price with "Was",
  the badge text from `discount_percent`; nothing struck when not on sale.
- `components/catalog/VariantPicker.test.tsx` — the product-level sale before a
  choice; the Sale marker and "On sale" name on the on-sale size only; the chosen
  variant's sale; a full-price variant drops the struck price and badge; the bag
  gets the sale price.
- `lib/catalog/variants.test.ts` — `onSale` per option; `statusOf` wording.
- `lib/catalog/query.test.ts` — `on_sale=true` round-trips and other values drop;
  canonical order; `hasFilters`, `appliedFilterCount`, `isSaleOnly`.
- `components/catalog/FilterPanel.test.tsx` — the On sale link's `href` and
  active state, toggling off, the hidden sort input.
- `lib/catalog/rails.test.ts`, `app/page.test.tsx` — eight on sale, the rail and
  its link, hidden when empty, none on failure.
- `components/layout/ShopMenu.test.tsx`, `components/layout/MobileNav.test.tsx` —
  both menus link Sale to `/products?on_sale=true`.

Visual check (2026-09-29): `yarn dev` on port 3100 at 1400px and 390px, against the
local API through a throwaway proxy that marked three products on sale, because
the local database had none. Card, listing hero, filter count, product page (a
shaded and a sized product, switching to a full-price size) and the home rail all
rendered as designed. The product photos 404'd from Cloudinary for every product,
sale or not, which is the demo data, not this feature.

---

## Files

```text
components/catalog/ProductPrice.tsx
components/catalog/{ProductCard,VariantPicker,FilterPanel,ShopHero,ProductListing}.tsx
components/layout/{site-links.ts,ShopMenu.tsx,MobileNav.tsx}
components/ui/badge.tsx
lib/api/{types,catalog}.ts
lib/catalog/{query,variants,rails}.ts
app/page.tsx
```
