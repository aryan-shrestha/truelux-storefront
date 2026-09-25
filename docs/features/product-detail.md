# Product detail

Status: Implemented

Last updated: 2026-09-24

---

## Goal

Sell one garment: the photography, the description, a variant picker that tells
the truth about availability, and an add-to-bag that cannot produce an invalid
line.

---

## Scope

What is included in this implementation?

- `/products/[slug]` — server-rendered from the detail endpoint
- The image gallery
- `components/catalog/VariantPicker` — size and colour, as a client component
- Add to bag, and its confirmation
- `generateMetadata` for the page
- The sold-out and unavailable states

What is explicitly outside the scope?

- The cart itself, which belongs to `cart.md` — this page appends a line and says
  so
- Structured data and Open Graph images, which belong to `seo-and-metadata.md`
- Related products, reviews, size guides, restock notifications — the API offers
  none of them
- Any stock quantity, ever. The API publishes a boolean

---

## Context

This page renders `GET /api/v1/products/{slug}/`, the only detail lookup in the
API that is by slug rather than by id.

The variant model is the thing to understand before designing the picker. A
product has a list of variants, each carrying a **size**, a **colour**, its own
**resolved price** and its own **`in_stock` boolean**. The list is not a grid —
the merchant creates the combinations that exist, so a product sold in three sizes
and two colours may have four variants rather than six, and a combination that
simply was not created is indistinguishable from one that sold out unless the
picker is built to tell them apart.

`variant.price` is already resolved: it is the variant's override where there is
one, and the product's `base_price` otherwise. It can differ between variants of
the same product, so **the price displayed must follow the selection**.

`variant.id` is the only thing checkout accepts. A cart line built from a size and
a colour rather than from a variant id cannot be checked out.

Stock here is up to fifteen minutes stale
([architecture.md](../architecture.md#data-fetching-and-caching)), and the backend
re-resolves it inside a row lock at placement. Everything this page says about
availability is provisional, and `checkout.md` owns what happens when it turns out
to be wrong.

---

## Planned

### The route

```tsx
export default async function ProductPage({ params }: PageProps<"/products/[slug]">) {
  const { slug } = await params;
  const product = await getProduct({ slug }).catch(notFoundOn("not_found"));
  // ...
}
```

`revalidate: 900`. A `not_found` becomes `notFound()`; every other `ApiError`
reaches the boundary.

`generateMetadata` returns the product name as the title, the description trimmed
to a summary, and the primary image as the Open Graph image.

### Layout

Photography dominates. On desktop, a two-column split with the gallery taking the
larger share and the buying panel sticky beside it; on mobile, the gallery full
bleed with the panel beneath.

```text
┌─────────────────────────┬──────────────────┐
│                         │  Oversized Tee   │
│                         │  Rs 2,400        │
│        image 1          │                  │
│                         │  Size            │
│                         │  [S][M][L][XL]   │
├─────────────────────────┤                  │
│                         │  Colour          │
│        image 2          │  [Black][Bone]   │
│                         │                  │
│                         │  [ Add to bag ]  │
└─────────────────────────┴──────────────────┘
              description, in Newsreader
```

Images are a vertical sequence rather than a carousel — a carousel hides
photographs behind an interaction, and photographs are what sells the garment.
The first image gets `priority`; no other image on the page does.

### The variant picker

A client component receiving `product.variants` as props. Two radio groups, size
then colour, with the state of each derived from the variant list rather than
assumed:

- A **size** is offered when at least one variant has it.
- Once a size is chosen, a **colour** is offered when a variant exists with that
  pairing, and is marked **unavailable** when it does not.
- A pairing that exists but has `in_stock: false` is marked **sold out**.
- A pairing that does not exist at all is marked **not made** — a different word,
  because they are different facts and a customer waiting for a restock deserves
  to know which one they are looking at.

Selection resolves to exactly one `variant.id`, and the displayed price updates to
that variant's price. Add to bag is disabled until a full selection resolves to an
in-stock variant.

When a product has one size or one colour, that group renders as a static label
rather than as a group of one.

### Add to bag

Appends a line through `lib/cart`, carrying the variant id, the quantity, and the
display fields the cart page needs
([ADR 0002](../decisions/0002-the-cart-is-browser-state.md)). It makes **no API
call** — availability is not checked until checkout, deliberately, because
checking here would be a check-then-act race that the backend already resolves
correctly inside a lock.

The confirmation is inline and keeps the customer on the page: the button's label
becomes "Added to bag", the header count increments, and a live region announces
it. No modal, no redirect to the cart, no toast that slides in from a corner.

### States

| State | Treatment |
| --- | --- |
| Every variant sold out | The picker is visible but inert, the button says "Sold out", and the page says nothing about restocking because nothing can notify |
| Product has no variants | The merchant has not finished setting it up. Treated as sold out, not as an error |

Both rows changed in implementation, and the reasons are worth keeping:

- **A sold-out product renders no add-to-bag button at all**, rather than a
  button reading "Sold out". A disabled control that names the thing it cannot
  do invites clicking it; a sentence does not.
- **A product with no variants reads as unfinished, not as sold out.** "Sold
  out" tells a customer it existed and went; an unfinished product never did.
  The same distinction the picker draws between sold out and not made applies to
  the whole product.
| Product has no images | A `--color-wash` block at the gallery's aspect ratio |
| Slug not found or unpublished | `notFound()` — the API returns the same 404 for both and the page must not distinguish them either |

---

## Implemented

- `lib/catalog/variants.ts` — the sparse-pairing logic, separate from any
  component so it can be tested without rendering: `sizeOptions`, `colorOptions`,
  `findVariant`, `statusOf`, `isEntirelySoldOut`, `onlyOption`
- `app/products/[slug]/page.tsx` — `generateStaticParams` prerendering every
  product, `generateMetadata`, and a `not_found` turned into `notFound()`
- **`components/catalog/Gallery.tsx`** is a carousel since 2026-09-24,
  replacing the vertical sequence (see the superseded decision below).
  - The main image is a scroll-snapping track, so it swipes, flicks and
    arrow-key steps natively. Thumbnails and the prev/next buttons only scroll
    it, and the active index is read back from where it rests.
  - Thumbnails stack vertically on the left from `lg`, with a Motion
    `layoutId` marker that slides between them. They sit in a row under the
    image below `lg`.
  - A "2 / 3" counter and the buttons overlay the image. A single photograph
    gets no controls.
  - `priority` is on the first image only, and a framed wash block holds the
    shape when there are none.
  - The frame is on the wrapper, and the slides are 4px apart and scrolled to
    by their own `offsetLeft`. A border on the track, or index × width
    stepping, left a 1px sliver of the previous photograph.
- **From `lg` the gallery is the viewport's height:** `100svh − 90px − 3rem`.
  - It is sticky at `--header-offset`, so it follows the hiding header.
  - It is as wide as a 4:5 image of that height plus the thumbnail column,
    capped at 60% so a landscape tablet keeps room for the details.
- **`app/products/[slug]/loading.tsx`:** the page's skeleton in the same
  geometry.
- **Add to bag has no spinner, deliberately.** The bag is browser state and the
  add makes no request (ADR 0002), so there is nothing to wait for. On success
  a check draws in beside "Added to bag", and the header's count pops.
- `components/catalog/VariantPicker.tsx` — the only client component on the page
- `components/ui/Radio.tsx` — a radio group on native inputs; unavailable options
  are `aria-disabled` rather than `disabled`, so they keep their place in the tab
  order, and carry a **visible** status word
- `lib/catalog/variants.test.ts` (17), `VariantPicker.test.tsx` (9), and two legs
  of `tests/e2e/buy-flow.spec.ts`
- `components/catalog/Gallery.test.tsx`:
  - the first thumbnail is current
  - a thumbnail scrolls to its slide's offset
  - a swipe's resting place sets the current photograph
  - a single photograph gets no controls
  - an empty gallery keeps its shape

---

## Remaining

None.

---

## Decisions

### Decision: the picker distinguishes sold out from not made, visibly

**Decision**

A pairing with no variant reads "Not made". A pairing whose variant has
`in_stock: false` reads "Sold out". Both are **rendered text** beneath the
option, not only part of the accessible name.

The visible half was added after looking at the page. The first
implementation put the status in an `sr-only` span, so the two states were
identical struck-through chips to anyone looking at the screen — "different
facts, different words" has to be true for a sighted customer too.

**Reason**

They are different facts with different consequences for the customer, and the
variant list tells them apart precisely. Collapsing both into a greyed square
tells a customer that a size might come back when it was never offered.

**Consequence**

The picker's state machine is derived from the variant list rather than from a
size list and a colour list, which is more code and is the only way to get this
right.

### Decision: the price follows the selection

**Decision**

The displayed price is the selected variant's resolved price, not the product's
`base_price`.

**Reason**

`price_override` exists and is used for the cases where a variant genuinely costs
more — typically an extended size. Showing the base price while charging the
override is the kind of surprise that ends at a support message.

**Consequence**

Before a selection is made the page shows the base price, and it can change when a
size is chosen. That movement has to be designed for rather than hidden.

### Decision: add to bag makes no API call

**Decision**

Adding to the bag writes to `localStorage` and nothing else.

**Reason**

There is no cart endpoint to call, and checking availability first would be a
check-then-act race: stock can change between the check and the placement, so it
would reduce the frequency of the 422 without removing it — and make the code that
handles the 422 less exercised.

**Consequence**

A sold-out variant can enter the cart if the page's cached data is stale. Checkout
names the line and the customer fixes it there.

### Decision: a vertical gallery, not a carousel

**Superseded 2026-09-24**, at the merchant's request, by the carousel with
vertical thumbnails described under Implemented. The trade-off below still
holds: one photograph shows at a time. The thumbnails are what keep the others
one glance away.

**Decision**

Images stack. There is no carousel, no thumbnail strip and no lightbox.

**Reason**

The direction is editorial and the photographs are the product. A carousel puts
them behind an interaction and shows one at a time on the page where a customer
most wants to see all of them.

**Consequence**

A product with many images makes a long page on mobile. That is acceptable for a
lookbook and would not be for a catalogue of accessories.

---

## Gotchas

- **`yarn build` needs a reachable API that answers honestly.** Only the list call
  in `generateStaticParams` degrades to `[]`. If the list succeeds — live, or
  from a stale `.next/cache/fetch-cache` — and a detail call then fails, the
  prerender throws and the build fails. Seen on 2026-09-23 when an unrelated
  Django container on port 8000 answered every path with an HTML 404, which
  `lib/api` correctly reports as `server_error`.
- **The variant list is not a grid.** Do not derive sizes and colours
  independently and render their cartesian product; a combination the merchant
  never created would appear as an option.
- **`variant.price` is already resolved.** Do not fall back to `base_price` when a
  variant is selected, and do not compute anything — the API's figure is the
  figure.
- **`variant.id` is the only identifier checkout accepts.** A cart line keyed by
  size and colour cannot be submitted.
- **An unknown slug and an unpublished slug return the same 404.** The page must
  not distinguish them, or it confirms that a hidden product exists.
- **Stock is up to fifteen minutes stale** at `revalidate: 900`, and the API
  publishes only a boolean. Nothing on this page can say how many are left, and
  the checkout error will not say either.
- **Only the first image gets `priority`.** Marking several defeats it and slows
  the one that matters.
- The API supplies no image dimensions, so every image states its own aspect ratio
  or the page reflows as photographs load.
- A product with zero variants is a real state the merchant can create, and it
  will crash a picker that assumes at least one.
- The picker is the only client component on the page. Marking the whole route
  client to make it interactive forfeits the server render on the store's most
  important page.

---

## Routes

```text
/products/[slug]     server-rendered, revalidate 900, indexed
```

---

## API

### Calls

```text
GET /api/v1/products/{slug}/     server, revalidate 900
```

### Errors handled

| `code` | Treatment |
| --- | --- |
| `not_found` | `notFound()`. The same page for unknown and unpublished |
| `throttled` | The error boundary |
| any other | The error boundary |

---

## State and data

| Tier | Holds |
| --- | --- |
| React state | The selected size, the selected colour, and the resolved variant |
| `localStorage` | Written on add to bag, through `lib/cart`. Never read here |

The selection is deliberately **not** in the URL. It is a step in a purchase rather
than a view worth sharing, and putting it in the URL would mint a cache key per
variant on a route that already has one per product.

---

## Accessibility

- The picker is two `radiogroup`s with real labels, arrow-key navigation within
  each, and a single tab stop per group.
- An unavailable option stays focusable and is announced as unavailable, rather
  than being removed from the tab order — a customer needs to be able to find out
  that their size is sold out.
- "Sold out" and "not made" are words in the accessible name, not colour or
  opacity.
- The price is in a live region, because it can change when a size is selected and
  a customer who cannot see it change has been repriced silently.
- Add to bag announces through a polite live region. The button's label changing
  is not enough on its own.
- Gallery images carry the API's `alt_text`, and `alt=""` where it is empty.
- The sticky buying panel must not trap focus or cover the focused element on a
  short viewport.

---

## Tests

- `components/catalog/VariantPicker.test.tsx` — a product whose variants are not a
  full grid: the missing pairing reads "not made", the zero-stock pairing reads
  "sold out", and add to bag stays disabled for both
- `VariantPicker` — that the displayed price follows a `price_override` variant
- `VariantPicker` — a product with one size, rendering as a label
- `VariantPicker` — a product with no variants at all
- `app/products/[slug]` — that a `not_found` `ApiError` produces the not-found page
- `tests/e2e/buy-flow.spec.ts` covers select → add → header count, as its first leg

---

## Files

```text
app/products/[slug]/page.tsx
components/catalog/Gallery.tsx
components/catalog/VariantPicker.tsx
components/catalog/AddToBag.tsx
lib/api/catalog.ts            getProduct
lib/cart/                     the append
```

---

## Future context

The variant picker is where this feature's real complexity lives, and it is all in
one place: the variant list is a sparse set of pairings, not a grid, and every
derived state has to come from it. A picker built from independent size and colour
lists looks right against a well-formed product and lies about a sparse one.

Nothing on this page can tell a customer how many are left, and nothing should try
to infer it. The backend withholds `stock_quantity` from every serializer and omits
the available count from the `insufficient_stock` error, deliberately and for the
same reason. If a "only a few left" badge is ever wanted, it is a backend
conversation about what the catalogue is willing to publish, not a client-side
inference.
