# SEO and metadata

Status: In progress

Last updated: 2026-09-24

---

## Goal

Make the shop findable, and make a link to it look right when it is pasted into a
message — while keeping crawlers out of the pages that must not be crawled.

---

## Scope

What is included in this implementation?

- `generateMetadata` on every route that has one to generate
- `app/sitemap.ts`
- `app/robots.ts`, including the disallow rules that protect the request budget
- Open Graph and Twitter card data, and the images they use
- `Product` structured data on the detail page
- Canonical URLs
- `noindex` on the routes that carry a credential or a cart

What is explicitly outside the scope?

- Analytics of any kind. See Decisions
- A blog, a journal, or any content the API cannot supply
- Multi-language or `hreflang`
- Rich results beyond `Product`

---

## Context

This brand's customers arrive from an Instagram bio today. The point of a website
is to be reachable another way, so search matters more here than it does for a
store with existing traffic.

Three constraints from elsewhere shape everything in this feature.

[ADR 0001](../decisions/0001-the-browser-makes-every-customer-scoped-call.md)
gives the catalogue a per-IP request budget, and a crawler following filter links
spends it. `robots.ts` is therefore not a formality — it is part of the
architecture.

[ADR 0004](../decisions/0004-catalogue-state-lives-in-the-url.md) makes every
filter a URL, which is what makes them crawlable in the first place.

The order routes carry a **bearer credential in the path**. A crawler that reaches
one has been handed a live credential, which makes `noindex` and the referrer
policy security measures rather than SEO ones.

The API supplies no image dimensions and no Open Graph assets, and
`stock_quantity` is never published — so structured data can say whether something
is in stock and nothing more.

---

## Planned

### Metadata

`app/layout.tsx` sets `metadataBase` from `env.siteUrl` and a title template of
`%s — ${env.brandName}`. Without `metadataBase`, every Open Graph image resolves
relative to `localhost` in production, silently.

| Route | Title | Description | OG image |
| --- | --- | --- | --- |
| `/` | the brand name | one sentence about the shop | the hero photograph |
| `/products` | "Shop" | what the catalogue holds | the newest product's image |
| `/products/[slug]` | the product name | its description, trimmed | its primary image |
| `/cart`, `/checkout`, `/checkout/confirmation` | plain titles | — | none, and `noindex` |
| `/orders/**` | plain titles | — | none, and `noindex` |

A filtered listing sets a canonical URL pointing at the unfiltered listing, so the
crawler that reaches one anyway consolidates rather than indexing a near-duplicate.

### `robots.ts`

```text
Allow:     /
Allow:     /products
Allow:     /products/*
Disallow:  /products?*        every filtered listing
Disallow:  /cart
Disallow:  /checkout
Disallow:  /checkout/*
Disallow:  /orders
Disallow:  /orders/*
Sitemap:   {siteUrl}/sitemap.xml
```

The `/products?*` rule is the one that matters architecturally. Six filters
produce a combinatorial number of URLs, each a distinct cache key and each costing
upstream requests, for pages with no distinct content worth indexing.

The `/orders/*` rule is a security measure. It is also not sufficient on its own —
the routes carry `noindex` and a `same-origin` referrer policy too, because
`robots.txt` is a request, not a control.

### `sitemap.ts`

The home page, the unfiltered listing, and every published product. Products come
from `listProducts` paginated to exhaustion at generation time.

Nothing else. No filtered listings, no cart, no orders.

**The sitemap's product fetch counts against the catalogue budget** like any other
call. It runs at build and on revalidation, and its page size should be the
maximum the API allows — 100 — so a catalogue of 300 products costs three requests
rather than twelve.

### Structured data

`Product` JSON-LD on the detail page: name, description, images, brand, and an
`Offer` per variant carrying its resolved price, `NPR`, and an availability of
`InStock` or `OutOfStock`.

No `aggregateRating` and no `review` — there are none, and inventing them is
fabrication. No `priceValidUntil`, because nothing in the system knows one.

### Open Graph images

The product's primary image, at its Cloudinary URL. The API supplies no
dimensions, so the tags either omit them or state the crop the storefront
requests; they must not guess.

A product with no image falls back to the site-wide image in `public/`. A card
with a broken image is worse than a generic one.

---

## Implemented

Built on 2026-09-24 as part of making the storefront deployable. These are the
pieces a live site cannot go without.

- **`app/robots.ts`:** exactly the rules above.
  - `Disallow: /products?` is a prefix and the longer match, so it beats
    `Allow: /products` for any URL with a query string.
  - `/checkout` and `/orders` as prefixes also cover their sub-paths.
- **`app/sitemap.ts`:** the home page, the listing and every product.
  - It paginates `listProducts` at 100 to exhaustion.
  - On an `ApiError` or `ApiUnreachableError` it keeps the two fixed pages
    rather than failing the build. Anything else is rethrown.
  - It regenerates on the fetch's five-minute revalidate: a route takes its
    shortest fetch interval, so a route-level `revalidate` cannot lengthen
    it. `architecture.md` counts it.
- **`noindex` on every private route** was already in place in the route
  metadata: cart, checkout, confirmation and all three order routes.
  - `next.config.ts` adds `X-Robots-Tag: noindex, nofollow` on `/orders/*`.
  - It also adds a `same-origin` `Referrer-Policy` header on every response,
    alongside the metadata policy.
- **Tests:**
  - `app/robots.test.ts`: filtered listings, cart and credential routes are
    disallowed, and the sitemap is on the site's origin.
  - `app/sitemap.test.ts`: every product across pages, 100 at a time, and
    the fixed pages survive an API failure.

---

## Remaining

- `Product` JSON-LD on the detail page
- Open Graph images: the hero for `/`, the newest product for `/products`, and
  a site-wide fallback in `public/`
- A canonical URL on filtered listings pointing at the unfiltered one

---

## Decisions

### Decision: no analytics

**Decision**

No analytics script, no tag manager, no pixel, no session recorder — not on any
route.

**Reason**

The order routes carry a bearer credential in the URL path, and every analytics
product records full paths by default. Adding one and excluding those routes is a
configuration that must hold forever, applied by a tool whose whole purpose is to
record everything. The backend's own ADR names referrer and analytics leakage as
the accepted risk of guest checkout; this storefront's job is not to widen it.

There is also nothing to decide with the data yet.

**Consequence**

The merchant has no traffic data beyond Vercel's own request logs, which is a real
loss for a business trying to understand where customers come from. When analytics
are genuinely needed, the requirement is a tool that can be scoped to specific
routes at load time — not one excluded by configuration — and the order routes stay
excluded.

### Decision: filtered listings are disallowed, not `noindex`

**Decision**

`robots.ts` disallows `/products?*`. The pages remain fully functional and
shareable.

**Reason**

`noindex` requires the crawler to fetch the page to learn it should not index it,
which spends exactly the request the rule exists to prevent. Disallow stops the
fetch.

**Consequence**

A filtered URL shared on social media may show a less rich preview, because some
crawlers respect `robots.txt` for preview fetches too. The canonical tag handles
the ones that do fetch.

### Decision: structured data claims only what the API publishes

**Decision**

`Product` and `Offer` only, with availability from the `in_stock` boolean.

**Reason**

Ratings, review counts and inventory levels are what rich results reward, and the
API publishes none of them. Fabricating any of it is both dishonest and a
manual-action risk.

**Consequence**

The rich result is plainer than a competitor's. It is also true.

---

## Gotchas

- **`metadataBase` must be set**, or production Open Graph images silently resolve
  against `localhost`.
- **The sitemap's product fetch is on the catalogue budget.** Paginate at 100, not
  25.
- **`robots.txt` is a request, not a control.** The order routes need `noindex`
  and `same-origin` referrer policy as well, and the real protection is that the
  token is unguessable.
- **A filtered listing must set a canonical** pointing at the unfiltered listing,
  for the crawlers that fetch anyway.
- The product description is plain text with no length guarantee. Trim it for the
  meta description rather than emitting a paragraph.
- `alt_text` can be empty, which is fine for an image but not for an Open Graph
  `image:alt`. Omit the tag rather than emitting an empty one.
- Prices in JSON-LD are the variant's **resolved** price, not `base_price`, and
  the currency is `NPR` — which the API never states, because it is implicit.
- A product with several variants at different prices produces several `Offer`
  entries. Do not collapse them to a single price.
- **`/checkout/confirmation` carries an order number in its URL.** An order number
  is not a credential, but the page is still `noindex` — there is nothing there
  for a search engine.

---

## Routes

This feature owns no route of its own. It adds two files:

```text
app/sitemap.ts     regenerated on revalidation
app/robots.ts      static
```

---

## API

### Calls

```text
GET /api/v1/products/?limit=100&offset=…     server, revalidate 3600, sitemap only
```

The metadata for each route reuses the fetch that route already made. No route
fetches twice for its own metadata.

### Errors handled

| `code` | Treatment |
| --- | --- |
| any, in the sitemap | Emit the static routes only. A failed product fetch must not fail the build |

---

## State and data

```text
None.
```

---

## Accessibility

Metadata is not an accessibility surface, but two things overlap:

- A page title is the first thing a screen reader announces on navigation, so it
  must be specific. "Shop" on every page is a real accessibility failure, not only
  an SEO one.
- Structured data must agree with the visible page. A screen reader user hearing
  "in stock" from the page and a crawler reading `OutOfStock` means one of them is
  being lied to.

---

## Tests

- `app/sitemap.test.ts` — the static routes are present; products are paginated to
  exhaustion; a failed fetch emits the static routes rather than throwing
- `app/robots.test.ts` — the disallow rules match the routes they are meant to,
  including that `/products` is allowed while `/products?*` is not
- `app/products/[slug]/metadata.test.ts` — title, description trimming, the OG
  image, and the fallback when the product has no image
- A test that the `Product` JSON-LD emits one `Offer` per variant with the
  variant's own price

---

## Files

```text
app/layout.tsx                     metadataBase and the title template
app/sitemap.ts
app/robots.ts
app/products/[slug]/page.tsx       generateMetadata and the JSON-LD
components/seo/ProductJsonLd.tsx
public/                            the fallback Open Graph image
```

---

## Future context

`robots.ts` is load-bearing infrastructure here, not a formality: the disallow on
filtered listings is what stops a crawler from spending the catalogue's hourly
request budget. Anyone relaxing it should read
[ADR 0001](../decisions/0001-the-browser-makes-every-customer-scoped-call.md)
first.

The no-analytics decision will be challenged, probably soon and reasonably — a
business moving off Instagram wants to know whether the move worked. The condition
for revisiting is a tool that can be excluded from specific routes at load time
rather than by configuration, and the order routes stay excluded whatever else
changes.
