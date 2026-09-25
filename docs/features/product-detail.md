# Product detail

Status: Implemented

Last updated: 2026-09-25

---

## Goal

Sell one product: its brand, the photographs, the description, a picker that tells
the truth about which shades and sizes can be bought, and an add-to-bag that cannot
produce an invalid line.

---

## Scope

What is included in this implementation?

- `/products/[slug]`, server-rendered from the detail endpoint
- A breadcrumb (Shop, category, product) and the brand above the title, linking to
  the brand page
- The image gallery
- `VariantPicker`: shade swatches and sizes (see [shades-and-sizes.md](shades-and-sizes.md))
- Add to bag and its confirmation; the sold-out and unfinished states
- `generateMetadata`

What is explicitly outside the scope?

- Related products, reviews, shade finders, restock notifications (the API has none)
- Any stock quantity. The API publishes a boolean.

---

## Context

`GET /api/v1/products/{slug}/`. Variants are a **sparse set of pairings**: each
carries a size, a shade or `null`, its own resolved price and its own `in_stock`. A
combination the merchant never created is a different fact from one that sold out.
`variant.id` is the only thing checkout accepts.

---

## Implemented

- `app/products/[slug]/page.tsx` — `generateStaticParams` prerenders up to a hundred
  products and returns `[]` if the API is down; `load` turns `not_found` into
  `notFound()`; `generateMetadata` gives "{product} by {brand}", the description, a
  canonical URL and the primary image for Open Graph. `VariantPicker` is the only
  client component besides the gallery.
- `components/catalog/Gallery.tsx` — a shadcn `Carousel` of 4:5 slides with
  previous and next buttons, and thumbnail buttons that scroll to their slide and
  mark the current one with `aria-current`. Only the first image has `priority`. A
  product with no images keeps the slot's shape with a sentence.
- `components/catalog/VariantPicker.tsx` — the price follows the selection; shade
  and size `ToggleGroup`s; a group of one renders as a label; add to bag is enabled
  only when a variant with stock resolves and the bag is not full; the button reads
  "Added to bag" with a check, and a polite live region names the product. A hint
  says what is still missing ("a shade and a size"). An entirely sold-out product
  says so; a product with no variants says it is not available yet.
- `app/products/[slug]/loading.tsx` — the page's shape: gallery, swatches, sizes,
  button.

---

## Remaining

None.

---

## Decisions

### Decision: detail revalidates every 30 minutes

**Decision**

`getProduct` uses `revalidate: 1800` (it was 900).

**Reason**

The brand, shade and size reads added in 2026-09 would otherwise take the catalogue
budget past 600 an hour (see [architecture.md](../architecture.md#data-fetching-and-caching)).

**Consequence**

`in_stock` can be up to thirty minutes stale. The backend decides stock at
placement, and checkout reports the difference.

---

## Gotchas

- **The variant list is not a grid.** Do not build options from independent size
  and shade lists.
- **`variant.price` is already resolved**; never fall back to `base_price` once a
  variant is selected.
- **An unknown, an unpublished and an inactive-brand product return the same 404.**
  The page must not tell them apart.
- **`yarn build` needs an API that answers honestly.** Only the list call in
  `generateStaticParams` degrades; a list that succeeds followed by a failing detail
  call fails the prerender.
- A product with zero variants is a real state and renders "not available to buy
  yet".
- The API gives no image dimensions, so every image states its aspect ratio.

---

## Routes

```text
/products/[slug]    SSG for the first hundred products, on demand after; ISR at 1800s; indexed
```

---

## API

### Calls

```text
GET /api/v1/products/?limit=100    server, revalidate 300 (generateStaticParams)
GET /api/v1/products/{slug}/       server, revalidate 1800
```

### Errors handled

| `code` | Treatment |
| --- | --- |
| `not_found` | `notFound()` |
| anything else | The error boundary; metadata returns `{}` rather than throwing |

---

## State and data

- React state — the chosen size and shade, and whether this press added the line.
- `localStorage` `tl.cart.v2` — the line added, with `size`, `shade`, the resolved
  unit price and the primary image.

---

## Accessibility

- Toggle groups are radios to assistive technology, labelled by their visible
  "Shade" and "Size" text. A swatch's accessible name is the shade name, plus
  "Sold out" or "Not available in this combination" when disabled.
- The price is a polite live region, so a price override is heard.

---

## Tests

- `components/catalog/VariantPicker.test.tsx` — resolution, price override, disabled
  combinations, shadeless and single-variant products, sold-out and unfinished
  products, the line written to the bag.
- `components/catalog/Gallery.test.tsx` — thumbnails and controls, one image, none.
- `lib/catalog/variants.test.ts`.
- `tests/e2e/buy-flow.spec.ts` — a seeded shade product and a shadeless one.

---

## Files

```text
app/products/[slug]/
components/catalog/{Gallery,VariantPicker}.tsx
lib/catalog/variants.ts
```
