# SEO and metadata

Status: In progress

Last updated: 2026-09-26

---

## Goal

Make the shop findable and make a shared link look right, while keeping crawlers
out of the pages that must not be crawled and off the URLs that spend the catalogue
budget.

---

## Scope

What is included in this implementation?

- Metadata on every route, with `generateMetadata` where it depends on data
- `app/sitemap.ts` and `app/robots.ts`
- Open Graph data and a generated share image
- Canonical URLs
- `Product` structured data on the detail page

What is explicitly outside the scope?

- Per-product generated share images (the product's own photograph is used)

---

## Context

`robots.ts` is part of the request-budget architecture (ADR 0001): a crawler on
filtered listings mints cache keys. The order routes carry a credential.

---

## Implemented

- `app/layout.tsx` — `metadataBase`, the "%s | {brand}" template, the site
  description, Open Graph `siteName`, `type` and `locale` (`en_NP`), and a
  `same-origin` referrer policy.
- `app/opengraph-image.tsx` — a 1200×630 PNG generated with `ImageResponse`: the
  brand name, a line about the shop and a stone rule. It applies to every route
  that does not set its own image.
- Route metadata: home (canonical `/`), `/products` (canonical `/products` on every
  filtered, sorted or searched view), `/brands` (canonical), `/brands/[slug]`
  (brand name, description, canonical, logo as the share image),
  `/products/[slug]` ("{product} by {brand}", a 160-character description,
  canonical, primary image). Cart, checkout, confirmation and the order routes are
  `noindex`.
- `app/robots.ts` — allows `/`, `/products`, `/brands`; disallows `/products?`,
  `/brands/*?`, `/cart`, `/checkout`, `/orders`; points at the sitemap.
- `app/sitemap.ts` — home, `/products`, `/brands`, every active brand and every
  published product, reading products 100 at a time. An API failure keeps what was
  read and never fails the build.
- `next.config.ts` — `X-Robots-Tag: noindex, nofollow` on `/orders/*` and a
  `same-origin` `Referrer-Policy` on every response.

---

## Remaining

- `Product` JSON-LD on the detail page: one `Offer` per variant at its resolved
  price, in `NPR`, with availability from `in_stock`.

---

## Decisions

### Decision: one generated share image for the whole site

**Decision**

`app/opengraph-image.tsx` renders the fallback image from code.

**Reason**

The requirement forbids external image downloads, and there is no photography yet.

**Consequence**

Its colours repeat the light theme's by hand, because `ImageResponse` cannot read
CSS variables.

---

## Gotchas

- **`metadataBase` must be set**, or production Open Graph URLs resolve to localhost.
- **`Disallow: /products?` is the longer match**, so it beats `Allow: /products`
  for any URL with a query string. `/brands/*?` relies on the wildcard, which Google
  and Bing honour.
- **The sitemap's reads are on the catalogue budget.** Paginate at 100.
- **`robots.txt` is a request, not a control.** The order routes are also `noindex`
  and send a `same-origin` referrer.
- The sitemap regenerates on its shortest fetch interval (ten minutes), whatever a
  route-level `revalidate` says.

---

## Routes

```text
/robots.txt          static
/sitemap.xml         static, revalidated every 10 minutes
/opengraph-image     static PNG
```

---

## API

### Calls

```text
GET /api/v1/products/?limit=100&offset=…    server, revalidate 600 (sitemap)
GET /api/v1/brands/                         server, revalidate 3600 (sitemap)
```

### Errors handled

| `code` | Treatment |
| --- | --- |
| any `ApiError` or unreachable API, in the sitemap | Keep the pages read so far |

---

## Tests

- `app/robots.test.ts` — filtered listings and brand pages, cart, checkout and
  orders are disallowed; the sitemap is on the site's origin.
- `app/sitemap.test.ts` — fixed pages, brands and every product across pages, and
  survival of an API failure.

---

## Files

```text
app/layout.tsx
app/opengraph-image.tsx
app/robots.ts
app/sitemap.ts
next.config.ts
```
