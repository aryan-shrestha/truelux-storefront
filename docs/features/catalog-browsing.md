# Catalogue browsing

Status: Implemented

Last updated: 2026-09-23

---

## Goal

Let a customer find a garment: a server-rendered, filterable, shareable product
listing that stays inside the backend's request budget.

---

## Scope

What is included in this implementation?

- `/products` — the listing, server-rendered from search parameters
- Filtering by category, size, colour, price range and stock
- Search, sorting and pagination
- `components/catalog/ProductGrid` and `ProductCard`
- `components/catalog/FilterRail` — filters as links
- Search parameter normalisation, and the canonical URL it produces
- The empty state, which is a reachable page rather than an edge case

What is explicitly outside the scope?

- The product detail page, which belongs to `product-detail.md`
- Anything the API does not offer: faceted counts, fuzzy search, related products,
  child-category filtering, price sorting computed client-side
- Infinite scroll
- Saving or restoring a customer's last-used filters
- `robots.ts` and the sitemap, which belong to `seo-and-metadata.md`

---

## Context

This is the feature that spends most of the backend's catalogue budget, and the
one whose design is most constrained by it.

[ADR 0001](../decisions/0001-the-browser-makes-every-customer-scoped-call.md)
renders the listing on the server at `revalidate: 300`, which costs twelve upstream
requests an hour **per distinct cache key**. Every distinct query string is a
distinct key.

[ADR 0004](../decisions/0004-catalogue-state-lives-in-the-url.md) puts every
filter in the URL, which is what makes server rendering possible — and which is
also what makes cache keys cheap to create. Normalisation is the mechanism that
reconciles those two facts, and it is the load-bearing part of this feature.

What the API gives, and does not
([backend-api.md](../integrations/backend-api.md)):

- Filters are `category`, `size`, `color`, `min_price`, `max_price`, `in_stock`
- `ordering` accepts **only** `name`, `base_price`, `created_at`, and **silently
  ignores** anything else
- `search` is a case-insensitive substring over name and description — no ranking,
  no stemming, no typo tolerance
- `?category=` does not descend into child categories
- `min_price` and `max_price` compare against `base_price`, **not** against a
  variant's resolved price, so a filter can exclude a product whose displayed
  variant price is inside the range
- There are no facet counts, so a filter cannot say how many products it will
  return before it is applied
- `stock_quantity` is never serialised — only a boolean

---

## Planned

### The route

`app/products/page.tsx`, a server component:

1. read `searchParams`
2. normalise them into a `ProductQuery`
3. call `listProducts`
4. render the grid, the filter rail and the pagination

### Normalisation

The single most important function in this feature:

```ts
function toProductQuery(raw: Record<string, string | string[] | undefined>): ProductQuery;
```

Rules:

- **Allowlist.** Only `category`, `size`, `color`, `min_price`, `max_price`,
  `in_stock`, `search`, `ordering`, `offset` are read. Everything else — `utm_*`,
  a stray `fbclid`, a hand-typed parameter — is dropped.
- **Validate shape.** Slugs must match a slug pattern; prices must parse as
  positive numbers; `in_stock` must be exactly `true`; `ordering` must be one of
  six accepted values; `offset` must be a non-negative multiple of the page size.
- **Drop empties.** `?search=` and `?category=` with no value are removed, not
  forwarded.
- **Canonical order.** The resulting query string is assembled in a fixed field
  order, so `?size=m&category=tees` and `?category=tees&size=m` produce one cache
  key.
- **Redirect when the normalised URL differs** from the requested one, so there is
  one canonical URL per view and a crawler cannot hold two.

An invalid value is dropped rather than rejected. A customer who hand-edits a URL
sees the shop, not an error.

### The grid

Uniform, comparable tiles — `design-system.md` explains why the listing does not
use the home page's asymmetric rhythm. Each tile:

```text
┌──────────────┐
│              │   full-bleed image, fixed aspect ratio,
│    image     │   no card, no border, no shadow
│              │
└──────────────┘
Oversized Tee      name
Rs 2,400           price, from base_price
Sold out           only when in_stock is false
```

`primary_image` can be `null`, and a tile with no photograph is a real state —
the backend has no image requirement. It renders a `--color-wash` block at the
same aspect ratio rather than collapsing.

`base_price` is the product's price, and a variant override can make the real price
higher. The card shows the base price without a "from" prefix unless the product
detail confirms a spread, which the list payload cannot tell us — so the listing
states the base price plainly and the detail page is authoritative.

### The filter rail

Every filter is an `<a>` to the same route with one parameter changed. Selecting
one is a navigation; deselecting is a link with the parameter removed.

Sizes and colours come from the categories the merchant has created — but the API
has **no endpoint that lists sizes or colours**. They can only be discovered from
the variants of products already fetched, which is a per-page view of a global
set. The rail therefore offers the sizes and colours present in the **current
result set**, and says so by framing them as "narrow these results" rather than as
a global filter.

Sorting is a `<select>` inside a `<form method="get">`, so it works without
JavaScript and enhances to submit on change.

### Pagination

Limit/offset, page size 25, rendered as numbered links. Not infinite scroll:
infinite scroll needs client-side fetching, which forfeits the cache, the server
render and ADR 0001's budget in one move.

The API's `next` and `previous` URLs are **not** used — they are absolute URLs
built from the request's host, which is the internal one for a server-rendered
call. Pagination links are computed from `count` and `offset`.

### Empty states

Three different ones, because they need three different answers:

| Situation | Response |
| --- | --- |
| Filters match nothing | Name the filters applied, offer to clear each, keep the rail visible |
| Search matches nothing | Say that search is a plain text match and suggest a shorter term, because "tshirt" genuinely does not find "t-shirt" |
| The catalogue is empty | The merchant has published nothing. Say the shop is not open yet, rather than showing a broken grid |

---

## Implemented

- `lib/catalog/query.ts` — `toProductQuery` (nine parameters, everything else
  dropped), `toCanonicalSearch`, `toRequestedSearch`, `hasFilters` and
  `hrefWith`. `limit` is **not** in the allowlist; it is fixed at `PAGE_SIZE`
- `app/products/page.tsx` — awaits `searchParams`, normalises them, redirects to
  the canonical URL when they differ, fetches, and renders the three empty states
- `components/catalog/ProductGrid.tsx` and `ProductCard.tsx` — a uniform grid;
  the card is one link around the whole tile, renders without a photograph, and
  says "Sold out" in words
- `components/catalog/FilterRail.tsx` — category, price band and stock as links;
  sort as a real `<form method="get">` carrying the other filters as hidden
  inputs, so it works before JavaScript loads.
  - **Since 2026-09-24**, a parent with children is a native `<details>` with
    a "+" that turns to "×". It works without JavaScript and opens by
    keyboard.
  - The parent's own filter moves inside the group as "All {name}", because
    a link inside the summary would be a control within a control.
  - A group opens by default when it holds the applied category.
  - Opening and closing animates height where the browser supports
    `::details-content`.
- **The rail is sticky** from `md`, at `--header-offset` plus 1.5rem, and
  follows the hiding header.
  - It has its own scroll within `100svh − offset − 3rem`, through the
    `scroll-quiet` utility: a thin `--line` thumb on no track, darkening on
    hover, never the platform scrollbar.
  - A hairline `--line` border sits on its right.
  - It sticks only while the results column is taller than it. With a
    handful of results the row ends first, which is correct.
- **Results stream** in a Suspense boundary keyed on the canonical query, with
  `ProductGridSkeleton` as the fallback.
  - Without the key, a navigation within `/products` left the old results on
    screen until the new ones arrived, with no sign anything was happening.
  - The piece count suspends inside a live region that stays mounted, so the
    change is still announced.
  - Both call `listProducts(query)`. Identical fetches are deduplicated within
    a render, so it is one request.
  - `app/products/loading.tsx` covers arrival from another page.
- `components/catalog/Pagination.tsx` — page links computed from `count` and
  `offset`
- `lib/catalog/navigation.ts` — `navigationCategories`, shared with the header.
  It is the one place in the storefront that swallows an `ApiError`, and it
  lives in `lib` because two features need it
- `next.config.ts` — `images.remotePatterns` for Cloudinary and for the local
  API, plus `dangerouslyAllowLocalIP` in development only
- `app/products/query.test.ts` (24 tests), `ProductCard.test.tsx` (6), and the
  listing's leg of `tests/e2e/buy-flow.spec.ts`
- `components/catalog/FilterRail.test.tsx`:
  - a parent with children collapses, and a childless one is a plain link
  - the group holding the applied category is open
  - the parent's own filter is "All {name}" inside the group

---

## Remaining

- **`robots.ts` does not exist yet**, so nothing stops a crawler following
  filtered URLs. It belongs to `seo-and-metadata` (#10). Until it lands the
  normaliser is the only protection, and it bounds the *set* of reachable cache
  keys without stopping a crawler walking all of them.
- **Child-category filtering is absent in the API.** A parent category shows only
  what is attached directly to it. The backend's own documentation describes the
  one-line fix; nothing here can substitute for it without fetching every child
  and merging, which would multiply the request cost per view.

---

## Decisions

### Decision: search parameters are normalised and the URL is canonicalised

**Decision**

Unknown parameters are dropped, values are validated, the field order is fixed, and
a request whose normalised form differs from its URL is redirected to the canonical
one.

**Reason**

Every distinct query string is a cache key, and cache keys are the numerator of
ADR 0001's throttle budget. Without normalisation the set of reachable keys is
whatever a crawler, a marketing link or a bored visitor produces, and 600 requests
an hour is not many when each `utm_source` value mints a new one.

**Consequence**

Adding a filter means adding it to the allowlist, the validator and the canonical
ordering, in the same commit. A filter added to the UI but not to the allowlist
silently does nothing — which is a confusing bug, and the reason the three live in
one function.

### Decision: pagination is numbered links, not infinite scroll

**Decision**

Numbered page links, computed from `count` and `offset`.

**Reason**

Infinite scroll requires fetching from the browser, which forfeits the server
render, the cache and the budget. It also makes the listing unlinkable past the
first screen and the footer unreachable.

**Consequence**

The listing feels less modern than the Instagram feed these customers arrive from.
It loads faster, works without JavaScript, and can be shared at any page.

### Decision: the rail offers no size or colour picker at all

**Decision**

The rail offers category, price band and stock. `?size=` and `?color=` remain
valid parameters and are honoured when present; neither is surfaced as a control.

This **replaces** this document's original plan to derive both from the current
result set, which turned out to be impossible.

**Reason**

The list payload carries no variants. `ProductListSerializer` publishes `id`,
`name`, `slug`, `base_price`, `category`, `primary_image` and `in_stock` — and
that boolean comes from an `Exists` annotation precisely so no variant row
crosses the network on a list request. There is nothing in the response to derive
sizes from, and the API has no endpoint that lists them.

The alternatives were hardcoding a size run — which the backend's ADR 0007
rejected because the merchant changes it — or fetching every product's detail to
build the set, which would cost the request budget many times over.

**Consequence**

A customer cannot narrow by size from the listing, which is a real gap on a
clothing site. Closing it needs the backend to publish the lookup tables. That is
worth raising: it is a small read endpoint on their side, and there is no
client-side substitute.

### Decision: price is offered as fixed bands, not as a range input

**Decision**

Three bands, each setting `min_price` and `max_price` to known values.

**Reason**

Two number inputs would let a visitor mint a distinct cache key for every value
they type, which is the hole the normaliser exists to close.

**Consequence**

The bands are invented and unmeasured. They should move once the catalogue's real
price distribution is known.

---

## Gotchas

- **Every distinct query string is a cache key.** This is the feature that can
  break the throttle budget, and it breaks it as 429s on the shop's busiest page.
- **Reading `searchParams` makes the route dynamic, and that is fine.** The route
  renders per request, but `fetch` with `revalidate` still serves from the data
  cache — five requests to one listing URL were verified to produce exactly one
  upstream call. The budget counts upstream requests, not renders.
- **`searchParams` is a promise** in this version of Next and must be awaited.
- **Next refuses to optimise an image whose host resolves to a private address.**
  That is the right default against SSRF, and it means every product image fails
  against a local backend. `next.config.ts` sets `dangerouslyAllowLocalIP` in
  development only; it must never be true in production.
- **`ordering` is silently ignored when invalid.** A typo produces the default
  order with no error, which makes a broken sort control look like it works.
- **`min_price` and `max_price` filter on `base_price`, not on variant price.** A
  product whose only variant carries a `price_override` above the range still
  matches. Do not describe the filter as "price" without qualification if this
  starts confusing customers.
- **`primary_image` can be `null`.** A tile must render at the right aspect ratio
  without a photograph.
- **`alt_text` can be an empty string**, which means decorative. Do not substitute
  the product name — a grid of tiles each announcing the same phrase twice is worse
  than silence.
- **`in_stock` on a product means "some variant has stock".** A product whose only
  stocked variant is a size the customer does not wear reads as in stock. Combining
  `?size=` with `?in_stock=` is what narrows it, and the copy should not overclaim.
- **The API's `next`/`previous` URLs carry the server's own host.** Rendering them
  as links in the browser produces links to an unreachable address.
- **`?category=` does not descend.** A parent category can legitimately show
  nothing.
- Search is a substring match. The empty state has to explain this, because a
  customer searching "tshirt" and getting nothing will conclude the shop has no
  t-shirts.
- The listing is at `revalidate: 300`, so a newly published product takes up to
  five minutes to appear. The merchant will notice this and should be told.

---

## Routes

```text
/products                    server-rendered, revalidate 300, indexed
/products?<filters>          server-rendered, revalidate 300, NOT indexed
```

Filtered URLs are disallowed in `robots.ts` — see `seo-and-metadata.md`. They stay
shareable and linkable; they are simply not crawled.

---

## API

### Calls

```text
GET /api/v1/products/?<normalised query>     server, revalidate 300
```

The category list for the rail comes from the shell's own fetch and is passed down,
rather than being fetched a second time here.

### Errors handled

| `code` | Treatment |
| --- | --- |
| `throttled` | The error boundary, with copy that says the shop is busy. Never retried automatically |
| any other | The error boundary |

There is no `not_found` on a listing — an unmatched filter is an empty result set
with a 200, which is why the empty states matter.

---

## State and data

| Tier | Holds |
| --- | --- |
| URL search params | Every filter, the search term, the sort and the offset. Nothing else holds them |
| React state | None |

There is deliberately no client-side mirror of the filter state. See
[ADR 0004](../decisions/0004-catalogue-state-lives-in-the-url.md).

---

## Accessibility

- **Filters are links**, so they work with a keyboard, a screen reader and the back
  button without any code. An applied filter is `aria-current`.
- The result count is announced when it changes, through a polite live region, so a
  screen reader user learns that a filter narrowed the set.
- Sorting is a real `<select>` in a `<form>`, usable without JavaScript.
- Each tile is one link wrapping the image and the name, not two links to the same
  place — duplicate adjacent links are noise in a screen reader's link list.
- "Sold out" is a word on the tile, not a grey overlay. Colour never carries it.
- Pagination links have accessible names that say the page number, and the current
  page is `aria-current="page"`.

---

## Tests

- `app/products/query.test.ts` — normalisation: unknown parameters dropped, invalid
  values dropped, empty values dropped, field order canonical, and that two
  differently-ordered equivalent URLs produce one query
- `components/catalog/ProductCard.test.tsx` — a product with no `primary_image`, a
  product with empty `alt_text`, and the sold-out state
- `components/catalog/FilterRail.test.tsx` — that filters render as links with the
  expected hrefs, and that removing one produces a URL without it
- `app/products/pagination.test.ts` — page links computed from `count` and
  `offset`, including the last partial page and a `count` of zero
- The three empty states, each rendered

---

## Files

```text
app/products/page.tsx
app/products/query.ts               normalisation and canonicalisation
components/catalog/ProductGrid.tsx
components/catalog/ProductCard.tsx
components/catalog/FilterRail.tsx
components/catalog/Pagination.tsx
lib/api/catalog.ts                  listProducts
```

---

## Future context

The normalisation function is the most valuable code in this feature. It is the
only thing standing between a crawler and ADR 0001's request budget, and its
failure mode is not an error — it is 429s appearing on the shop's busiest page
during a campaign.

Two API gaps shape the UI and should be raised against the backend rather than
worked around here: no size or colour lookup endpoint, and no child-category
filtering. Both have small fixes on that side and no good fix on this one.

When the backend adds facet counts — if it ever does — the rail changes from
"what the results contain" to a real global filter, and the framing copy changes
with it.
