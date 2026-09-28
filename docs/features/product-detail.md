# Product detail

Status: Implemented

Last updated: 2026-09-29

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
- A gallery beside a panel, inside the header's `max-w-page` column: the category breadcrumb (root, then the
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
  parallel (the tree is the header's read, deduplicated). On a landscape viewport
  from `md` (`md:landscape:`) the gallery and panel sit side by side; the gallery is
  exactly `100svh - 5rem` tall (the viewport under the 80px header) and sets the
  row's height. The article is the header's column (`max-w-page`, centred, `px-4`,
  `md:px-8`), so the gallery's left edge and the panel's right edge line up with
  the navbar at every width. The panel never scrolls: it centres vertically and
  fills the rest of the row (stacked, the full column width), and its spacing shrinks with the screen's height (`gap-fit-*` and
  `py-fit-*`, below) so it fits; on a screen too short even then (a landscape phone)
  it grows the row instead. Everywhere else (phones, portrait tablets) they stack:
  gallery, then panel. Then the routine and care bands, then the related rail in
  its own `Suspense`. `generateStaticParams`, `load` and
  `generateMetadata` as before.
- `components/catalog/ProductBreadcrumb.tsx` — root, then the product's category,
  both linking to their listings; just the category when the tree is unavailable.
- `components/catalog/Gallery.tsx` — a shadcn `Carousel` with a thumbnail strip
  (64px thumbnails, 84px from `md`). Stacked, the strip is a row under the
  photograph that scrolls sideways; side by side, it is a column on the
  photograph's left that takes the photograph's height and scrolls, and round `floating` Previous/Next buttons (a `Button` variant, 44px,
  chevrons) over the photograph. The strip and the buttons show even for one
  photograph (one thumbnail, both buttons disabled), at the client's request. Stacked, the photograph is 9:10 at the column's full
  width; side by side it is the row's full height and 9:10 wide, the gallery capped
  at 62% of the row, past which the photograph is cropped (`object-cover`) rather
  than squeezing the panel.
- `components/catalog/VariantPicker.tsx` — unchanged behaviour; the price in the
  sans at `text-2xl`, and Add to bag full width at 56px.
- `components/catalog/ProductDetails.tsx` — a `dl` under a charcoal rule at the foot
  of the panel: Suited to (the skin-type names joined), Skin feel, Key ingredients. Blank values are
  dropped, and nothing renders when all three are blank.
- `components/catalog/SkinRoutine.tsx` — static: Cleanse, Treat, Protect, as an
  ordered list of numbered cards joined by plus signs on the greige band.
- `components/catalog/ProductCare.tsx` — on the stone band, an `Accordion` with
  Delivery (`shippingNote()`, from `GET /shipping/`; see checkout-quote.md), Payment and Authenticity (from
  `components/layout/promises.ts`), and `public/art/texture.svg` beside it from `md`.
- `components/catalog/RelatedProducts.tsx` — "Combine with": `relatedProducts()`
  asks for nine from the product's category, drops the product itself, keeps eight,
  and renders a `ProductRail`, or nothing.
- `app/products/[slug]/loading.tsx` — the same shape: photograph, thumbnails
  (under it stacked, beside it on landscape) and panel, height-locked on landscape.

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
- **No product page is prerendered at build.** `generateStaticParams` returns `[]`,
  so each page renders on first request and is cached for 1800s. Prerendering the
  first hundred burst about two hundred API calls from the build machine at once,
  and Render's edge answered with 429s (plain text, no `X-Request-ID`, so not the
  Django throttle) that failed the deploy. Do not restore the list call without
  throttling the build.
- **The detail mapper expects `skin_types`, `skin_feel` and `key_ingredients`.** A
  backend that predates the skin-types migration fails every product page; deploy
  the backend first.
- A category with one product shows no related rail: the product itself is dropped.
- The API gives no image dimensions, so every image states its aspect ratio. In the
  side-by-side layout the photograph's box is fixed by the row's height instead.
- **The gallery's height chain needs `CarouselContent`'s viewport to be `h-full`**
  (tailored in `components/ui/carousel.tsx`); without it the slides cannot fill the
  height-locked gallery. It has no effect where the carousel's height is auto (the hero,
  the rails).
- **The gallery, not the article, carries the height** so a panel taller than the
  screen grows the row rather than overflowing or scrolling.
- **The panel's spacing is `--fit-step`** (`app/globals.css`): Tailwind's 4px step
  everywhere except landscape from `md`, where it is
  `clamp(1.5px, 1.25svh - 7.5px, 4px)` — full from 920px tall, the floor at 720px.
  Only the panel's gaps and paddings use it (the panel, its header, `VariantPicker`'s
  root, the detail rows); type, controls and 44px targets keep their size. Do not
  scale `--spacing` itself, which would shrink every control. Tuned on 2026-09-27
  against the seeded catalogue: the longest skincare panel (three detail rows) fits
  at 1920×1080, 1440×900, 1366×768, 1280×720, 1180×820 and 1024×768. Longer copy or
  more rows can still grow the row; nothing scrolls.
- **The panel has no side padding of its own**; the article's gutters are the
  header's. Side by side it takes `pl-8` (`pl-12` from `xl`) as the gap to the
  gallery. Do not cap it with a `max-w-*`: a cap left-aligns it and leaves an empty
  band before the right gutter.
- **`5rem` in the gallery's height is the header's `md:h-20`**, not `--header-offset`,
  which drops to 0 when the header hides and would resize the row on scroll. The
  announcement bar is not subtracted: the row fills the screen once it has scrolled
  away.
- **A landscape phone is `md`** (844×390): it gets the side-by-side layout, with a
  310px gallery and a panel that makes the row taller (390–620px).

---

## Routes

```text
/products/[slug]    rendered on first request, never at build; ISR at 1800s; indexed
```

---

## API

### Calls

```text
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
