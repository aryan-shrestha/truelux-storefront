# Product detail

Status: Implemented

Last updated: 2026-09-26

---

## Goal

Sell one product: the photographs, its category and brand, the description, a
picker that tells the truth about which shades and sizes can be bought, the skin it
suits, and an add-to-bag that cannot produce an invalid line. Laid out as
`Product-detail---desktop-1..3.png` and `Product-detail---mobile-img0-275x4096.png`
([design-alignment.md](design-alignment.md)).

---

## Scope

What is included in this implementation?

- `/products/[slug]`, server-rendered from the detail endpoint
- A full-bleed gallery beside a panel: the category breadcrumb (root, then the
  product's own category), the title, the brand, the description, the price, the
  shade and size pickers, and a full-width dark Add to bag
- Ruled **Suited to** (`skin_types`), **Skin feel** and **Key ingredients** rows,
  each hidden when empty
- The static Skin routine band
- A Delivery / Payment / Authenticity accordion band beside an image
- Combine with: other products from the same category
- `generateMetadata`

What is explicitly outside the scope?

- Reviews and ratings, "Save to cabinet" (wishlist), shade finders, restock
  notifications: the API has none
- The design's Benefits and How to use copy: the API has no such fields
- Any stock quantity. The API publishes a boolean.

---

## Context

`GET /api/v1/products/{slug}/`. Variants are a **sparse set of pairings**: each
carries a size, a shade or `null`, its own resolved price and its own `in_stock`.
`variant.id` is the only thing checkout accepts. The detail also carries
`skin_types`, `skin_feel` and `key_ingredients`
(`../back-end/docs/features/skin-types.md`): always present, `[]` and `""` when
unset.

---

## Implemented

- `app/products/[slug]/page.tsx` — reads the product and the category tree in
  parallel (the tree is the header's read, deduplicated), lays out a
  `69fr / 31fr` grid from `md`, then the routine and care bands flush beneath it,
  then the related rail in its own `Suspense`. `generateStaticParams`, `load` and
  `generateMetadata` as before.
- `components/catalog/ProductBreadcrumb.tsx` — root, then the product's category,
  both linking to their listings; just the category when the tree is unavailable.
- `components/catalog/Gallery.tsx` — the carousel and thumbnails as before, square
  and at 9:10, sized for 70% of the viewport.
- `components/catalog/VariantPicker.tsx` — unchanged behaviour; the price in the
  sans at `text-2xl`, and Add to bag full width at 56px.
- `components/catalog/ProductDetails.tsx` — a `dl` under a charcoal rule: Suited to
  (the skin-type names joined), Skin feel, Key ingredients. Blank values are
  dropped, and nothing renders when all three are blank.
- `components/catalog/SkinRoutine.tsx` — static: Cleanse, Treat, Protect, as an
  ordered list of numbered cards joined by plus signs on the greige band.
- `components/catalog/ProductCare.tsx` — on the stone band, an `Accordion` with
  Delivery (`shippingNote()`, from `GET /shipping/`; see checkout-quote.md), Payment and Authenticity (from
  `components/layout/promises.ts`), and `public/art/texture.svg` beside it from `md`.
- `components/catalog/RelatedProducts.tsx` — "Combine with": `relatedProducts()`
  asks for nine from the product's category, drops the product itself, keeps eight,
  and renders a `ProductRail`, or nothing.
- `app/products/[slug]/loading.tsx` — the gallery and panel's shape.

---

## Remaining

None.

---

## Decisions

### Decision: detail revalidates every 30 minutes

**Decision**

`getProduct` uses `revalidate: 1800`.

**Reason**

The catalogue budget (see [architecture.md](../architecture.md#data-fetching-and-caching)).

**Consequence**

`in_stock` can be up to thirty minutes stale. The backend decides stock at
placement, and checkout reports the difference.

### Decision: related products are their own read, revalidated hourly

**Decision**

`listRelatedProducts({ category, limit: 9 })` revalidates every 3600 seconds, not
the listing's 600.

**Reason**

It adds one cache key per category that products sit in; at the listing's interval
those keys would cost six times as much. A suggestion an hour stale is
harmless.

**Consequence**

The request budget in `architecture.md` counts them as their own line.

### Decision: the care rows are hidden, not shown blank

**Decision**

A row with no data does not render, and the whole block disappears when all three
are empty.

**Reason**

Makeup and fragrance have no skin types or skin feel; an empty "Suited to" reads
as "suits nobody".

**Consequence**

The panel's length varies by product.

---

## Gotchas

- **The variant list is not a grid.** Do not build options from independent size
  and shade lists.
- **`variant.price` is already resolved**; never fall back to `base_price` once a
  variant is selected.
- **An unknown, an unpublished and an inactive-brand product return the same 404.**
- **`yarn build` needs an API that answers honestly.** Only the list call in
  `generateStaticParams` degrades.
- **The detail mapper expects `skin_types`, `skin_feel` and `key_ingredients`.** A
  backend that predates the skin-types migration fails every product page; deploy
  the backend first.
- A category with one product shows no related rail: the product itself is dropped.
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
GET /api/v1/products/?limit=100                  server, revalidate 600 (generateStaticParams)
GET /api/v1/products/{slug}/                     server, revalidate 1800
GET /api/v1/products/?category=<slug>&limit=9    server, revalidate 3600 (related)
GET /api/v1/categories/                          server, revalidate 3600 (breadcrumb, shared)
```

### Errors handled

| `code` | Treatment |
| --- | --- |
| `not_found` | `notFound()` |
| any, on the related read | No rail |
| anything else | The error boundary; metadata returns `{}` rather than throwing |

---

## State and data

- React state — the chosen size and shade, and whether this press added the line.
- `localStorage` `tl.cart.v2` — the line added.

---

## Accessibility

- Toggle groups are radios to assistive technology, labelled by their visible
  "Shade" and "Size" text.
- The price is a polite live region, so a price override is heard.
- The care rows are a description list; the routine is an ordered list whose
  numbers and plus signs are hidden from assistive technology.

---

## Tests

- `components/catalog/ProductDetails.test.tsx` — the three rows; each hidden when
  empty or blank; nothing at all when every row is empty.
- `lib/catalog/rails.test.ts` — `relatedProducts` asks for nine from the category,
  drops the product, keeps eight, degrades to none.
- `components/catalog/VariantPicker.test.tsx`, `components/catalog/Gallery.test.tsx`,
  `lib/catalog/variants.test.ts`.
- `lib/api/catalog.test.ts` — the three new fields are mapped.
- `tests/e2e/buy-flow.spec.ts` — a shade product and a shadeless one.

---

## Files

```text
app/products/[slug]/
components/catalog/{Gallery,VariantPicker,ProductBreadcrumb,ProductDetails,SkinRoutine,ProductCare,RelatedProducts}.tsx
lib/catalog/{variants,rails}.ts
```
