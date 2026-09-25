# ADR 0001: The server renders the catalogue; the browser makes every customer-scoped call

Status: Accepted

Date: 2026-09-21

Supersedes: None

---

## Context

The backend rate-limits **per IP address**. Its scopes and defaults:

| Scope | Rate | Endpoints |
| --- | --- | --- |
| `catalog` | 600/hour | products, product detail, categories |
| `anon` | 60/hour | order detail by access token |
| `checkout` | 30/hour | `POST /checkout/` |
| `order_lookup` | 20/hour | `POST /orders/lookup/` |

Those numbers were chosen for a browser. One shopper opening a dozen products, then
checking out, sits comfortably inside all four.

A deployed Next.js storefront is **one IP address**. If Server Components make
every call, every customer in the country shares a single budget. Thirty checkouts
an hour becomes thirty checkouts an hour *for the whole shop*, and twenty order
lookups an hour becomes a lockout the first afternoon anyone shares the link on
Instagram. The shop would fail hardest exactly when it was succeeding.

The obvious answer — move everything into the browser — costs the thing a
storefront cannot afford to lose. Product pages are the pages search engines index
and the pages a slow phone on a Kathmandu mobile network loads first. Rendering
them client-side means an empty grid, a spinner, and no server-rendered HTML for a
crawler to read.

There is a third fact that points the same way as the first. An order's
`access_token` is a bearer credential, and rendering `/orders/{accessToken}` on the
server puts that credential into the request path of a Vercel function, which means
into Vercel's logs.

## Decision

**Server Components fetch the catalogue. The browser fetches everything
customer-scoped.**

Server-rendered, cached, with an explicit `revalidate`:

```text
GET /api/v1/products/
GET /api/v1/products/{slug}/
GET /api/v1/categories/
```

Fetched from the customer's own browser, `cache: "no-store"`:

```text
POST /api/v1/checkout/
GET  /api/v1/orders/{access_token}/
POST /api/v1/orders/lookup/
```

`/checkout`, `/orders/[accessToken]`, `/orders/failed` and `/orders/lookup` render
a server shell and do their work in a client component inside it.

There is no proxy route. The storefront does not expose `/api/*` routes of its own
that forward to the backend, because a proxy puts the server's IP back in front of
the throttle and re-creates the problem it was built to avoid.

## Reason

The split follows the throttle, and the throttle follows what each endpoint is for.

The catalogue is public, identical for every visitor, and cacheable. Server
rendering it does not multiply requests by traffic — it multiplies them by *cache
keys and revalidation frequency*, which is a number this repository controls:

```text
upstream calls per hour  =  Σ (hot cache keys × 3600 / revalidate)
```

At the chosen intervals that comes to roughly 520 an hour against a ceiling of 600,
and because revalidation is lazy the real figure is far below it. Traffic does not
enter the equation. A hundred thousand visitors cost the same as one.

The customer-scoped calls are the opposite in every respect: unique per customer,
uncacheable, and rate-limited at figures that only make sense per person. Leaving
them in the browser makes the limit do what it was designed to do — stop one abuser
without touching anyone else.

The credential argument settles the order routes independently. An access token that
reaches only the browser it was redirected to has one place to leak from. One that
passes through a server function has two.

## Alternatives considered

### Render everything on the server

Why it was not chosen: it is the simplest model and the one with the best
first-paint story, and it needs no CORS. It fails on arithmetic. Thirty checkouts
an hour across all customers is not a storefront, and asking the backend to exempt
the storefront's IP replaces a rate limit with an allowlist that protects nothing —
the exempted IP is the one making all the requests. It also puts every access token
through a server log.

### Render everything in the browser

Why it was not chosen: the throttles work correctly and there is no CORS
subtlety, but product pages stop being server-rendered. A clothing brand leaving
Instagram is trying to be findable, and an empty `<div>` is not indexable. It also
gives up the data cache, so every visitor's browser makes its own catalogue
requests and the per-IP limit starts biting *shared* connections — a college or an
office behind one NAT address would exhaust the catalogue budget between them.

### A Next.js route handler proxying the API, forwarding the client's IP

Why it was not chosen: forwarding `X-Forwarded-For` and having the backend trust it
means the backend trusts a header any client can set, which turns the rate limit
into a suggestion. Trusting it only from the storefront's IP is an allowlist plus a
spoofable header, which is worse than either alone. The proxy also buys nothing —
there is no secret to hide, because the API has no authentication.

### Server-render the catalogue and proxy only checkout

Why it was not chosen: this is the same proxy problem with a smaller blast radius.
It also adds a second way to call the API — `lib/api` and a route handler — which
is the boundary this repository most wants to keep singular.

## Consequences

### Positive

- Product and category pages are statically rendered, cached, and indexable, at a
  fixed and calculable cost to the backend.
- Rate limits land on the customer who triggered them. One person hammering
  checkout cannot lock out the shop.
- Access tokens never reach a server log, an edge function, or any infrastructure
  the storefront operates.
- Traffic growth costs the backend nothing on the catalogue. Scaling the storefront
  is a CDN problem, not an API problem.

### Negative

- **The storefront depends on CORS.** A new deployed origin does not work until it
  is added to the backend's `DJANGO_CORS_ALLOWED_ORIGINS`, and that is a backend
  deploy. The failure mode is a checkout that works locally and fails in production
  with a browser console error and no server-side trace.
- Checkout and the order routes have no server-rendered content, so they show a
  loading state where the catalogue shows HTML. They are also the routes where a
  customer is most anxious, which makes their loading states a design problem
  rather than an afterthought.
- Two fetch paths exist in one module. `lib/api` is called from both server and
  client, reads a different base URL in each, and a function used from the wrong
  side fails in a way that is obvious in production and easy to miss locally, where
  both URLs are the same.
- The backend's error responses now reach the browser directly, so error handling
  has to be genuinely good in client components rather than deferred to an
  `error.tsx`.

### Constraints introduced

- **Every catalogue read states an explicit `revalidate`**, and the set of them is a
  budget, not a set of independent choices. Adding a server-rendered catalogue call
  means re-checking the arithmetic.
- **Search parameters are normalised before they reach a cache key**, so unknown
  parameters cannot mint cache entries and spend the budget.
- **`robots.ts` disallows filtered listing URLs**, for the same reason.
- **No storefront route handler may call the backend.** There is no `app/api/`
  directory, and adding one is a reversal of this decision.
- **Customer-scoped calls set `cache: "no-store"`.** A cached order page is both
  wrong and a credential leak between visitors.
- The order routes must be `noindex`, must load no third-party scripts, and must
  set a `same-origin` referrer policy.

## Implementation

```text
lib/api/client.ts                 base URL selection, revalidate, no-store
lib/api/catalog.ts                server-only reads
lib/api/orders.ts                 browser-only calls
lib/env.ts                        API_BASE_URL and NEXT_PUBLIC_API_BASE_URL
app/products/                     server-rendered
app/checkout/                     server shell, client component
app/orders/                       server shell, client component
app/robots.ts                     disallows filtered listing URLs
docs/architecture.md              the revalidate table and the budget arithmetic
docs/integrations/backend-api.md  the throttle rates this is derived from
```

## Future reconsideration

Revisit when the catalogue passes roughly 120 products, which is where the
arithmetic stops fitting inside 600 requests an hour. The choice at that point is
between longer revalidation intervals and a higher `DJANGO_THROTTLE_CATALOG`, and
it should be made deliberately rather than discovered as 429s on product pages.

Revisit if the backend adds customer accounts in Phase 2. An authenticated request
carries a token, `user` throttling replaces `anon`, and the calculus changes — but
note that the credential argument for keeping order pages in the browser survives
accounts, because a session token in a server function is the same exposure as an
access token in one.

Revisit if the storefront ever needs to hold a secret. The moment there is a key
that must not reach a browser, a server-side call path becomes necessary, and this
decision would have to be re-argued around that requirement rather than around
throttling.
