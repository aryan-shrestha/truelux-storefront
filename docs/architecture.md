# Architecture

Last updated: 2026-09-21

This document describes the current architecture of the storefront.

It should describe durable architectural facts, not implementation history or a
tutorial for the entire codebase.

---

## System overview

A Next.js App Router storefront for a Kathmandu streetwear brand moving off
Instagram. It owns no data. Every product, price, stock figure and order lives in
the backend API, and the storefront's entire job is to render that data well and to
hand a cart back as an order.

```text
                        ┌─────────────────────────────┐
  Customer's browser ───┤ Vercel (TLS, CDN, functions)│
                        └──────────────┬──────────────┘
                                       │
                        Server Components render
                        the catalogue, cached
                                       │
                                       ↓
                            Django REST API  ←──────── the same browser,
                            /api/v1/                   directly, for checkout
                                       │               and order routes
                                       ↓
                            Supabase · Cloudinary · Khalti

  Browser-owned state:  localStorage (cart, local order record)
                        URL search params (catalogue filters)
```

Three properties define this architecture:

- **The storefront owns no data and no authority.** It holds no database, no
  session, no server-side cart. Every price it displays is a cached copy, and
  every one of them is re-resolved by the backend at checkout. When the two
  disagree, the backend is right and the storefront shows what the backend
  returned.
- **The server renders only what is public and cacheable.** The backend throttles
  per IP, and a deployed storefront is one IP. Anything customer-scoped —
  checkout, order lookup, order status — is fetched by the customer's own browser,
  so the rate limit applies to the customer rather than to the whole shop. See
  [ADR 0001](decisions/0001-the-browser-makes-every-customer-scoped-call.md).
- **There is no authentication.** Not "not yet wired up" — the API has no accounts
  at all. The only credential in the system is an order's `access_token`, which
  arrives in a URL and must be treated as one.

---

## Application structure

```text
app/
    layout.tsx              root layout, fonts, header, footer
    page.tsx                the editorial home
    error.tsx               route-level failure
    not-found.tsx
    products/
        page.tsx            listing; reads searchParams
        [slug]/page.tsx     detail
    cart/page.tsx
    checkout/
        page.tsx
        confirmation/page.tsx
    orders/
        [accessToken]/page.tsx   the Khalti success landing
        failed/page.tsx          the Khalti failure landing
        lookup/page.tsx
    sitemap.ts
    robots.ts
components/
    ui/                     primitives: Button, Field, Dialog, Skeleton
    layout/                 Header, Footer, Nav
    catalog/                ProductCard, ProductGrid, FilterRail, VariantPicker
    cart/
    checkout/
lib/
    api/                    the only place that calls the backend
    cart/                   reducer, storage, context
    orders/                 the local order record
    format/                 money, dates
    env.ts                  every environment variable, read once
tests/
    e2e/                    Playwright
docs/
public/
```

### `app/`

Routes and nothing else. A file under `app/` defines a URL, its metadata, its
loading and error boundaries, and the composition of components that fill it.

A route may call `lib/api`. It may not contain layout maths, formatting, business
rules, or a `fetch`. If a page component is long, the length belongs in
`components/`, not in `app/`.

### `components/`

`components/ui/` holds primitives with no knowledge of the domain: a `Button` does
not know what a product is. Everything else is grouped by the part of the store it
belongs to.

Components receive data as props. A component below the route does not fetch —
with one deliberate exception, the client components that own a customer-scoped
call (see Render flow).

### `lib/api/`

**The only module in the repository that calls the backend.** It owns the base URL,
the caching policy, the parsing of the error envelope, and the types of everything
that crosses the boundary. A `fetch` to the API anywhere else is an architectural
error, not a shortcut.

### `lib/<domain>/`

The cart, the local order record, money formatting. Plain TypeScript with no React
in it where that is possible, so it can be tested without rendering anything.

There is no `utils.ts`, `helpers.ts`, or `common.ts`. A module whose name does not
say what is inside becomes a dumping ground within a month.

---

## Render flow

```text
Request
    ↓
Vercel edge → Next.js route
    ↓
Server Component
    ↓
lib/api (fetch with an explicit revalidate)
    ↓
Next data cache ──hit──→ cached JSON
    │
    miss
    ↓
Django REST API
    ↓
Parse envelope → typed domain object, or throw ApiError
    ↓
RSC payload → HTML → hydration
    ↓
Client component takes over interaction
```

Deviations from this flow, all deliberate:

- **Checkout and the order routes never touch the server.** `app/checkout/page.tsx`
  and `app/orders/**` render a shell on the server and the client component inside
  makes the API call from the browser. This is the whole point of ADR 0001: the
  per-IP throttle must land on the customer, and an access token should never
  reach a server log.
- **The cart page reads nothing from the API.** It renders `localStorage`. Prices
  shown there are the ones captured when the item was added, and the backend
  corrects them at checkout.
- **`/orders/{accessToken}` is a landing zone for a payment that has just
  completed.** It is arrived at by redirect from the backend, mid-verification, and
  must render a considered waiting state rather than looking broken.
- **`sitemap.ts` and `robots.ts`** call `lib/api` at build and revalidation time
  like any other server read.

---

## Layer boundaries

### Routes (`app/**/page.tsx`, `layout.tsx`)

Responsibility: define a URL. Read `params` and `searchParams`, call one or two
`lib/api` functions, export `generateMetadata`, compose components, and set the
caching directive for the route.

Restrictions: no `fetch`, no formatting, no conditional business logic about what
the data *means*. A route containing an `if` about domain state has taken a
component's job.

### Server Components

Responsibility: turn data into markup. The default for everything.

Restrictions: no state, no effects, no event handlers, no browser APIs. A Server
Component that needs one of those has found the boundary where a client component
begins — and the boundary should be pushed as far down the tree as it will go.
Wrapping a whole page in `"use client"` to make one button interactive forfeits
server rendering for the entire page.

### Client Components (`"use client"`)

Responsibility: interaction. The variant picker, the cart, the filter controls, the
checkout form, and the three order routes.

Restrictions: a client component may call `lib/api` **only** for a customer-scoped
endpoint. It never fetches the catalogue — that is the server's job and its cache's
job. It never reads `process.env` directly; it reads `lib/env`.

### `lib/api`

Responsibility: the wire. One function per endpoint, named for what it returns.
Build the URL, set the caching directive, send the request, parse the envelope,
return a typed domain object or throw `ApiError`.

Restrictions: no React, no components, no formatting, no rendering decisions. It
returns data, never JSX and never a status code. It does not decide what a failure
looks like — it only names the failure.

### Domain modules (`lib/cart`, `lib/orders`, `lib/format`)

Responsibility: rules that are the storefront's own. How a cart line merges with an
identical one, how an amount is displayed, what the storefront remembers about an
order it has placed.

Restrictions: no `fetch`, no knowledge of the API's URL structure. `lib/cart` holds
variant ids and quantities because that is what checkout takes, and knows nothing
else about the API.

### Primitives (`components/ui`)

Responsibility: one interaction or one piece of visual vocabulary, styled from
design tokens.

Restrictions: no domain knowledge, no data fetching, no copy. A primitive that
imports a type from `lib/api` is not a primitive.

---

## Data fetching and caching

Every catalogue read is a server-side `fetch` with an **explicit** `revalidate`.
There is no implicit caching decision anywhere: a call that does not state its
policy is incomplete.

| Read | `revalidate` | Why |
| --- | --- | --- |
| `GET /categories/` | 3600 | Navigation. Changes when the merchant restructures the shop, which is rare |
| `GET /products/` | 300 | The listing. Five minutes is short enough that a new drop appears promptly |
| `GET /products/{slug}/` | 900 | Detail. `in_stock` can be up to fifteen minutes stale, which is acceptable because it is not authoritative anyway |

**The revalidation numbers are a throttle budget, not a taste.** The catalogue scope
allows 600 requests an hour from one IP, and a deployed storefront is treated as
one IP. On Vercel that is the conservative reading: functions leave from a pool
of addresses rather than one, so the real per-address load is usually lower, but
nothing guarantees how the pool is shared, and the arithmetic must hold even if
every request leaves from one address. The worst case is

```text
upstream calls per hour  =  Σ (hot cache keys × 3600 / revalidate)
```

At the current numbers: ten listing keys plus the home page's own
(`ordering=-created_at&limit=9`) at 12/hour, the sitemap's one key per hundred
products (`limit=100&offset=…`) at 12/hour, a hundred product keys at 4/hour,
categories at 1/hour — about 545 an hour against a ceiling of 600. Revalidation is
lazy, so the real figure is far lower, but the worst case is what matters.

**When the catalogue passes roughly 120 products, this budget breaks.** The fix is
to lengthen `revalidate` on the detail read or to raise `DJANGO_THROTTLE_CATALOG`
on the backend — a deliberate choice either way, and one that must be made before
the 429s appear rather than after.

Two rules follow from that arithmetic:

- **Search parameters are normalised before they reach a cache key.** An unknown or
  malformed parameter is dropped rather than forwarded, so `?utm_source=...` and
  `?size=NONSENSE` collapse onto the canonical key instead of each minting a new
  one. Without this, a crawler manufactures cache keys faster than the budget can
  absorb them.
- **`robots.ts` disallows filtered listing URLs.** The unfiltered listing and the
  product pages are what should be indexed; every filter combination is a
  crawlable URL that costs upstream requests and adds no distinct content.

**There is no client data-fetching library.** No React Query, no SWR. The catalogue
is cached by the server and never refetched in the browser; the three
customer-scoped calls each happen once, in response to a deliberate action, and a
cache with invalidation rules would be infrastructure for a problem this storefront
does not have.

---

## State

Three tiers, and nothing else. Anything that does not fit one of them is a design
question, not a library question.

| Tier | Holds | Lives for |
| --- | --- | --- |
| URL search params | Catalogue filters, search, sort, page | The link |
| `localStorage` | The cart; the local order record | The device |
| React state | Open menus, form fields, transient UI | The page view |

**Catalogue state is in the URL** so a filtered view can be shared, linked and
server-rendered, and so the browser's back button behaves. See
[ADR 0004](decisions/0004-catalogue-state-lives-in-the-url.md).

**The cart is `localStorage`** because the API has no cart. It stores variant ids,
quantities, and enough display data to render the cart page without a network call
— knowingly stale display data, corrected at checkout. See
[ADR 0002](decisions/0002-the-cart-is-browser-state.md).

**The local order record** exists because the backend cannot yet email a customer
their `access_token`. The storefront remembers the order numbers it placed so it
can offer the lookup flow instead of leaving the customer with nothing. See
[ADR 0006](decisions/0006-the-storefront-keeps-its-own-order-record.md).

There is no global client store — no Redux, no Zustand, no Jotai. The cart is one
context; everything else is local.

**Anything read from `localStorage` is untrusted input.** It may be absent,
truncated, from an older version of the schema, or edited by hand. It is parsed and
validated at the boundary exactly like a network response, and a failed parse
resets to empty rather than throwing.

---

## Authentication and authorization

**There is none, because the API has none.** No accounts, no login, no tokens, no
cookies, no session. Nothing in this repository sends an `Authorization` header,
and nothing should be built that does.

The one credential in the system is an order's **`access_token`**, a UUID that
appears in the path of `/orders/{accessToken}`. Possession of it is the entire
authorization story for reading that order. It arrives in one of two ways: the
backend's redirect after a successful Khalti payment, or the confirmation email
sent when the order was placed. Both point at the same route.

Because it is a bearer credential in a URL, the order routes carry rules the rest of
the storefront does not:

- **No third-party scripts on `/orders/**`.** No analytics, no tag manager, no chat
  widget, no font or script from an origin that will see the full path.
- **The token is never logged, never put in an error message, never sent to any
  service.** It does not appear in a `console.log`, an error boundary's output, or
  a Vercel log line.
- **The order routes are `noindex`.** A crawler that reaches one has been handed a
  live credential.
- **Referrer policy is `same-origin`.** The default would leak the full URL to any
  outbound link.

The order-number fallback is not a credential and must not be treated as one. Order
numbers run in sequence, the backend rate-limits the lookup to twenty an hour, and
a wrong email returns the same 404 as a nonexistent order. The storefront must
phrase that failure as "we could not find that order" — saying "the email does not
match" turns the endpoint into an oracle the backend deliberately closed.

---

## Error handling

`lib/api` parses the backend's envelope once and throws a single error type, so no
component ever reads a status code:

```ts
class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details: Record<string, unknown>;
  readonly requestId: string | null;
}
```

**Branch on `code`.** The backend pins its codes as a public contract and rewords
its messages freely, so a storefront that matches on `message` breaks on a copy
edit. See [ADR 0005](decisions/0005-the-storefront-branches-on-api-error-codes.md).

| `code` | Where it can appear | Treatment |
| --- | --- | --- |
| `validation_error` | checkout, order lookup | Field-level messages from `details`, inline on the form |
| `not_found` | product detail, order detail, lookup | `notFound()` on the server; an explanatory panel in the browser |
| `variant_unavailable` | checkout | Name the affected lines from `details.variant_ids`, send the customer back to the cart |
| `insufficient_stock` | checkout | Name the one line from `details.variant_id`. **Never state a remaining quantity** — the API does not send one |
| `payment_gateway_unavailable` | checkout | The order exists. Show `details.order_number` prominently; this is not a retry |
| `payment_not_completed` | `/orders/failed` | The payment did not go through; offer to order again |
| `payment_amount_mismatch` | `/orders/failed` | Nothing the customer can fix. Show contact details |
| `throttled` | any | "Too many requests, try again shortly." Never retry automatically |
| `server_error` | any | The error boundary, with the request id |

A failure with a code not in that table renders the generic boundary. Adding a code
to the API surface means adding a row here.

Route-level failures use the framework's own boundaries: `error.tsx` for a thrown
`ApiError` during a server render, `not-found.tsx` for `notFound()`. A failure
inside a client component is rendered inline by that component, not thrown — a
failed checkout submission must not blank the form the customer just filled in.

**A network failure is not an `ApiError`.** A fetch that never reached the backend
has no envelope and no code, and is surfaced as such: "we could not reach the
store", not "something went wrong".

---

## External systems

| System | Purpose | Integration point | Important constraint |
| --- | --- | --- | --- |
| Django REST API | Every piece of data in the store | `lib/api` over HTTPS; `API_BASE_URL` / `NEXT_PUBLIC_API_BASE_URL` | Throttled **per IP**, so server rendering is confined to the catalogue. No cart, no accounts, no stock counts. Trailing slashes are required. See [backend-api.md](integrations/backend-api.md) |
| Cloudinary | Product image delivery **in production** | `next/image` against `res.cloudinary.com` | URLs are public and permanent regardless of publication state. No transformations, dimensions or placeholders come from the API — `next/image` must be given explicit sizes |
| The API's own `/media/` | Product image delivery **in development** | `next/image` against the API host | The backend's local settings use filesystem storage, so `image.url` is a **relative** path. `lib/api` resolves it; `next.config.ts` allows both hosts. Nothing about this exists in production |
| Khalti | Wallet payments | The browser is sent to `payment_url`; the backend handles the return | The storefront never calls Khalti. Links expire after 60 minutes, only `Completed` is success, and the return round trip is slow because the backend verifies server-to-server |
| Vercel | Hosting, CDN, image optimisation | Deploy target | The data cache and ISR are what make the throttle budget work. Moving off Vercel means re-deriving that budget, not just changing a deploy command |

**The two API base URLs are the same value today and may not stay so.** The server
reads `API_BASE_URL`, the browser reads `NEXT_PUBLIC_API_BASE_URL`, and both are
declared in `lib/env.ts`. Splitting them is what allows the server to use a private
network address later without exposing it to every visitor.

---

## Deployment shape

Vercel, with the App Router's defaults. Catalogue routes are statically rendered
and revalidated on the schedule above; the checkout and order routes are rendered
dynamically because they render nothing that could be cached.

Configuration arrives as environment variables and is read in `lib/env.ts` and
nowhere else, so one file lists the entire configuration surface. A missing
required variable fails the build rather than producing a page that half works.

Anything a browser can read is `NEXT_PUBLIC_`-prefixed and is therefore **public**.
There is nothing secret in this repository, and there must not be: the storefront
holds no API key, because the API has no authentication to hold a key for.

`NEXT_PUBLIC_BRAND_NAME` carries the brand's wordmark. It is configuration rather
than a constant, which constrains the design — see
[ADR 0007](decisions/0007-the-brand-wordmark-is-configuration.md).

**A new storefront origin needs a backend deploy.** Browser calls are cross-origin,
so the origin must be added to the backend's `DJANGO_CORS_ALLOWED_ORIGINS`, and the
backend's `STOREFRONT_URL` must point at it, or Khalti's return redirect and
every confirmation email land
somewhere else entirely.

---

## Accessibility and performance

These are architecture here, not polish, because both are decided by where
components sit rather than by what they look like.

- **Server-render everything that can be.** Every `"use client"` is markup that
  ships as JavaScript and renders twice.
- **The catalogue must work without JavaScript running.** Filters are links and
  form submissions that change the URL, so a slow connection gets a working shop
  rather than an empty grid. Interactivity enhances it; it is not load-bearing.
- **Images need explicit dimensions.** The API supplies none, so every `next/image`
  states its own `sizes` and aspect ratio. Without them the grid reflows as photos
  arrive, which is the single largest layout-shift risk in the store.
- **Focus, keyboard and contrast are requirements, not review comments.** The
  variant picker, the filter rail and the cart are the three places where a
  hand-rolled control can quietly become unusable by keyboard.

---

## Important constraints

Future implementation must preserve these:

- **Only `lib/api` calls the backend.** No `fetch` to the API from a component, a
  route, or a test helper.
- **Customer-scoped calls happen in the browser.** Checkout, order detail and order
  lookup are never server-rendered.
- **Money is a decimal string, end to end.** It is never parsed into a number, and
  arithmetic on it is the backend's job.
- **The storefront never decides a price, a total, a shipping fee, or whether
  something is in stock.** It displays what the API said.
- **`access_token` never leaves the browser it arrived in**, and never reaches a
  log, an analytics call, or a third-party script.
- **Every environment variable is read in `lib/env.ts`.**
- **Every catalogue fetch states its `revalidate` explicitly.**
- **No global client state store, and no client data-fetching library.**
- **No component library.** Primitives are built here, on the design tokens, with
  headless libraries used only where accessibility is genuinely hard.
- **The two routes the backend redirects to — `/orders/{accessToken}` and
  `/orders/failed` — must exist.** Nothing in either repository enforces it.

---

## Known architectural limitations

- **The catalogue throttle is a hard ceiling on server rendering.** Six hundred
  requests an hour from one IP bounds how many distinct pages can be cached and how
  fresh they can be. It is the first thing that will break as the catalogue grows,
  and it breaks as 429s on customer-facing pages.
- **Stock displayed on a product page can be fifteen minutes stale**, and the API
  publishes only a boolean anyway. A customer can add a sold-out variant to the
  cart and only discover it at checkout, as a 422. This is accepted: the backend
  decides stock inside a row lock, and any figure the storefront shows is a
  guess by comparison.
- **A confirmation email is sent but nothing confirms it arrived.** The backend
  emails the access token for both payment methods, and its `send_email` catches
  every exception so a failed send cannot fail a placed order. Nothing tells the
  storefront either way, so a customer who mistyped their address is left with the
  order number and the lookup at twenty attempts an hour.
- **A customer who pays and closes the tab is invisible.** Khalti has no webhook,
  the backend verifies only on the return redirect, and the storefront has no way
  to detect or recover it.
- **The category tree implies navigation the API cannot serve.** `?category=` does
  not descend into children, so a parent category link shows only what is attached
  directly to it. Presenting the tree as a menu will produce categories that look
  empty.
- **Search is a substring match.** "tshirt" does not find "t-shirt", and there is
  no ranking. Nothing in this repository can improve it.
- **Cart data is per-device and per-browser.** No sync, no recovery, and a cleared
  storage is a lost cart.
- **Cloudinary images arrive unoptimised and unmeasured.** Vercel's optimiser
  handles delivery, but the source files are whatever the merchant uploaded, and a
  twelve-megabyte photograph is a slow page the storefront cannot prevent.
- **Development against a real backend starts empty.** The backend's `size` and
  `color` tables ship with no rows and it has no merchant admin yet, so a fresh
  local API serves an empty catalogue until rows are created through the Django
  shell.
