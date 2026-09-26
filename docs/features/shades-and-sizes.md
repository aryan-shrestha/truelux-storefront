# Shades and sizes

Status: Implemented

Last updated: 2026-09-26

---

## Goal

Let shoppers see and pick shades as colour swatches, choose a size, and filter the
catalogue by both. Products without shades must look deliberate, not broken.

---

## Scope

What is included in this implementation?

- `VariantPicker`: shade swatches (a round button filled with `hex_code`, the shade
  name as its accessible name and visible on selection), and size choices. Built on
  shadcn `ToggleGroup`.
- A product whose variants all have `shade: null` shows the size picker only. A
  product with a single variant shows neither picker and adds that variant.
- Out-of-stock combinations stay visible but are disabled, with a strikethrough.
- `FilterPanel` (was `FilterRail`): a **Shade** group (swatches from `GET /api/v1/shades/`) and a
  **Size** group (from `GET /api/v1/sizes/`). This closes the gap the old
  `FilterRail` comment recorded, where the API had no such endpoints.
- Cart lines and the order summary show `Size · Shade`, or size alone.
- Every `color` reference becomes `shade`.

What is explicitly outside the scope?

- Shade finder or quiz
- Per-shade product images

---

## Context

Backend contract: `docs/features/shades-and-sizes.md` in the back-end repo. The
variant payload is `shade: { name, slug, hex_code } | null`.

---

## Implemented

- `lib/api/types.ts` — `ShadeRef` (`name`, `slug`, `hexCode`); `ProductVariant.shade`
  is `ShadeRef | null`; `OrderItem.variantShade` is `string | null`. `ColorRef` is
  gone.
- `lib/api/catalog.ts` — variants map `shade` (and `hex_code`); `listShades()` and
  `listSizes()` at `revalidate: 3600`; `listProducts` sends `shade`, never `color`.
- `lib/api/orders.ts` — `variant_shade` is read, and the backend's `""` for a
  shadeless line becomes `null`.
- `lib/catalog/query.ts` — `?shade=` replaces `?color=`; a `?color=` is dropped by
  the canonical redirect.
- `lib/catalog/variants.ts` — `sizeOptions`, `shadeOptions` (skipping null shades),
  `hasShades`, `findVariant` (a shadeless product resolves from the size alone),
  and `describeVariant` ("30 ml · Warm Beige", or "15 ml").
- `components/catalog/VariantPicker.tsx` — a shade `ToggleGroup` of round swatches
  (the `swatch` toggle variant, filled with `hexCode`), named for the shade, with
  the chosen shade's name shown beside the label; a size `ToggleGroup`. A shadeless
  product renders no shade group. A group of one renders as a label, so a
  single-variant product needs no choice. Unavailable options are disabled, struck
  through, and their accessible name says "Sold out" or "Not available in this
  combination".
- `components/catalog/FilterPanel.tsx` — Shade (swatch links) and Size (toggle-styled
  links) groups from `GET /shades/` and `GET /sizes/`, each link toggling its value.
- `lib/cart/storage.ts` — the cart line holds `shade: string | null`; the storage
  key moved to `tl.cart.v2`.
- `components/cart/CartLine.tsx`, `components/checkout/OrderSummary.tsx`,
  `components/checkout/CheckoutForm.tsx` (failure notices) and
  `components/orders/OrderView.tsx` — "Size · Shade", or the size alone.

---

## Remaining

None.

---

## Decisions

### Decision: unavailable options are disabled

**Decision**

A sold-out or never-made combination is a disabled toggle with a strikethrough.

**Reason**

The requirement. It reverses the fork's choice to keep them focusable with
`aria-disabled`.

**Consequence**

A keyboard user no longer tabs onto an unavailable option; the status is in each
option's accessible name and in the hint under the button. Choosing a shade can
disable a size (and the reverse); pressing the chosen swatch again clears it.

### Decision: the cart key was bumped, not migrated

**Decision**

`tl.cart.v1` is abandoned for `tl.cart.v2`.

**Reason**

`convention.md`: storage keys are bumped, never migrated. A v1 line has a colour
and no shade.

**Consequence**

A bag from the clothing fork does not carry over. No customer has one.

---

## Gotchas

- `/shades/` and `/sizes/` are facets: they list only values in use by a visible
  product, so a shade can vanish from the filter while a URL still carries it. The
  listing then shows its empty state.
- The API stores `""` for a shadeless order line, not `null`; `lib/api/orders.ts`
  normalises it.
- The swatch colour is API data drawn through an inline `style`, the one colour
  value outside the theme.

---

## Routes

None of its own. It changes `/products`, `/brands/[slug]` and `/products/[slug]`.

---

## API

### Calls

```text
GET /api/v1/shades/            server, revalidate 3600
GET /api/v1/sizes/             server, revalidate 3600
GET /api/v1/products/?shade=…&size=…   server, revalidate 600
```

### Errors handled

| `code` | Treatment |
| --- | --- |
| any, on `shades/` or `sizes/` | `listingFacets()` returns `[]` for that list, and the group is not rendered |

---

## State and data

- URL: `?shade=<slug>` and `?size=<slug>`, one each.
- `localStorage`: `tl.cart.v2`, each line with `size` and `shade` (`null` when
  shadeless).

---

## Tests

- `components/catalog/VariantPicker.test.tsx` — a shade and a size resolve the right
  variant id and price; a shadeless product renders no shade group and resolves from
  its size; a single-variant product needs no selection; out-of-stock and never-made
  combinations are disabled and say why.
- `lib/catalog/variants.test.ts` — option states, the shadeless path, `describeVariant`.
- `components/catalog/FilterPanel.test.tsx` — swatch and size links carry `?shade=` and
  `?size=`, and toggle off.
- `lib/api/catalog.test.ts` — `shade` and `hex_code` map, `null` stays `null`,
  `listShades` and `listSizes`.
- `lib/cart/storage.test.ts` — a shadeless line round-trips; the key is v2.
- `components/orders/OrderByToken.test.tsx`, `components/cart/CartContents.test.tsx`
  — "Size · Shade" and size alone.
- `tests/e2e/buy-flow.spec.ts` — a seeded shade product and a shadeless one.

---

## Files

```text
components/catalog/{VariantPicker,FilterPanel}.tsx
components/ui/toggle.tsx
lib/api/{catalog,orders,types}.ts
lib/catalog/{variants,query,navigation}.ts
lib/cart/storage.ts
```
