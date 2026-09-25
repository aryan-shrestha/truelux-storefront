# API client

Status: Implemented

Last updated: 2026-09-21

---

## Goal

Put every call to the backend behind one typed module, so that the wire format,
the caching policy and the error contract each exist in exactly one place.

---

## Scope

What is included in this implementation?

- `lib/api/client.ts` — the single `request` function: base URL selection, query
  building, caching directive, envelope parsing
- `lib/api/errors.ts` — `ApiError` and the parser that produces it
- `lib/api/types.ts` — every wire type, mirroring
  [backend-api.md](../integrations/backend-api.md) field for field
- `lib/api/catalog.ts` — `listProducts`, `getProduct`, `listCategories`
- `lib/api/orders.ts` — `submitCheckout`, `getOrder`, `lookupOrder`
- `lib/env.ts` — the two base URLs and the rest of the configuration surface
- `lib/format/money.ts` — the only module that parses an amount
- The `snake_case` → `camelCase` mapping, once, per type
- Test fixtures typed against the same types

What is explicitly outside the scope?

- Any component or route
- Retries, request deduplication, a cache layer of our own
- Runtime schema validation of API responses — see Decisions
- A generated client from the OpenAPI schema — see Decisions
- Anything that decides what a failure looks like to a customer

---

## Context

This module is the boundary the whole storefront is built on, which is why it comes
before every feature except the design system.

Three decisions constrain it before a line is written.

[ADR 0001](../decisions/0001-the-browser-makes-every-customer-scoped-call.md)
splits the calls in two. The catalogue is fetched by Server Components with an
explicit `revalidate`; checkout, order detail and order lookup are fetched by the
browser with `cache: "no-store"`. One module serves both, which means it reads a
different base URL depending on where it is running.

[ADR 0003](../decisions/0003-money-is-a-decimal-string-end-to-end.md) makes every
amount a `string`, all the way through. `lib/api` is where that type is declared
and where a careless `Number()` would do the damage.

[ADR 0005](../decisions/0005-the-storefront-branches-on-api-error-codes.md) makes
`code` the only thing anything branches on. This module is the single throw site,
and `ApiError` is the only error type above it.

The API's own shape is transcribed in
[backend-api.md](../integrations/backend-api.md) and is not repeated here.

---

## Planned

### `lib/env.ts`

Every environment variable, read once:

```ts
export const env = {
  apiBaseUrl: required("API_BASE_URL"),
  publicApiBaseUrl: required("NEXT_PUBLIC_API_BASE_URL"),
  brandName: required("NEXT_PUBLIC_BRAND_NAME"),
  siteUrl: required("NEXT_PUBLIC_SITE_URL"),
} as const;
```

`required` throws on a missing value, so the build fails rather than a page
rendering `undefined`.

### `lib/api/client.ts`

One function, used by every endpoint module:

```ts
type RequestOptions = {
  query?: Record<string, string | number | boolean | undefined>;
  method?: "GET" | "POST";
  body?: unknown;
} & ({ revalidate: number } | { cache: "no-store" });

async function request<T>(path: string, options: RequestOptions): Promise<T>;
```

The caching directive is a **required** part of the options union, so a call that
states neither does not compile. This is the mechanism that keeps
[ADR 0001](../decisions/0001-the-browser-makes-every-customer-scoped-call.md)'s
throttle budget honest — no call can silently inherit a default.

The function:

1. picks the base URL — `env.apiBaseUrl` when `typeof window === "undefined"`,
   `env.publicApiBaseUrl` otherwise
2. appends the path, which always ends in a trailing slash
3. builds the query with `URLSearchParams`, omitting `undefined` and empty values
   so the cache key stays canonical
4. sends the request with `Accept: application/json`, no credentials, no custom
   headers
5. on a 2xx, parses the body and returns it
6. on anything else, parses the envelope and throws `ApiError`
7. on a transport failure, throws the underlying error unwrapped

### `lib/api/errors.ts`

```ts
export class ApiError extends Error {
  constructor(
    readonly code: string,
    readonly status: number,
    readonly details: Record<string, unknown>,
    readonly requestId: string | null,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
```

The parser reads `error.code`, `error.message` and `error.details` from the body
and `X-Request-ID` from the headers. A non-JSON body, or JSON without an `error`
object, produces an `ApiError` with code `server_error` — the envelope is a
contract, and a response that does not honour it is a server fault whatever its
status says.

### `lib/api/types.ts`

The wire types, in `camelCase`, with `Money` as a string alias. One mapping
function per type, explicit, no generic key transformer:

```ts
function toProductSummary(raw: RawProductSummary): ProductSummary;
```

A generic `snakeToCamel` over arbitrary objects would be shorter and would defeat
the point: the mapping functions are where a field rename on the backend becomes a
type error here, and a generic transformer types as `any` in every direction.

### `lib/api/catalog.ts`

```ts
listProducts(query: ProductQuery): Promise<Page<ProductSummary>>   // revalidate 300
getProduct({ slug }): Promise<Product>                             // revalidate 900
listCategories(): Promise<Category[]>                              // revalidate 3600
```

`listCategories` returns a bare array — the one endpoint with no pagination
envelope — and its return type says so.

`ProductQuery` is the normalised shape produced by the listing route, not raw
search parameters. `toSearchParams` converts it, dropping anything absent.

### `lib/api/orders.ts`

```ts
submitCheckout(input: CheckoutInput): Promise<CheckoutResult>      // no-store
getOrder({ accessToken }): Promise<Order>                          // no-store
lookupOrder({ orderNumber, email }): Promise<Order>                // no-store
```

`CheckoutResult` models `payment_url` as **optional**, not nullable, because the
API omits the key for cash on delivery rather than sending null:

```ts
type CheckoutResult = {
  orderNumber: string;
  status: OrderStatus;
  subtotal: Money;
  shippingFee: Money;
  total: Money;
  paymentUrl?: string;
};
```

### `lib/format/money.ts`

```ts
formatPrice("4500.00"); // "Rs 4,500"
```

Splits on the decimal point, groups the integer part, and drops `.00`. It shows
paisa when there are any. It is the only place in the repository permitted to
parse an amount.

---

## Implemented

- `lib/env.ts` — all five variables, each read as a literal `process.env.X`
  rather than through a lookup, because Next inlines `NEXT_PUBLIC_*` by static
  analysis and cannot see `process.env[name]`. A missing value throws
- `lib/api/client.ts` — `request<T>()` with the caching directive required by the
  options union, base-URL selection evaluated per call, `URLSearchParams` query
  building that drops absent and empty values, a trailing-slash assertion, and
  `toAbsoluteImageUrl`
- `lib/api/errors.ts` — `ApiError`, `ApiUnreachableError`, `toApiError`,
  `isApiError` and `hasCode`. A body that is not JSON, or JSON with no `error`
  object, becomes `server_error` rather than being reported as the condition it
  claims
- `lib/api/types.ts` — every wire type, `Money` as a string alias, `paymentUrl`
  optional rather than nullable
- `lib/api/catalog.ts` — `listProducts`, `getProduct`, `listCategories`, with one
  explicit mapping function per type
- `lib/api/orders.ts` — `submitCheckout`, `getOrder`, `lookupOrder`, all
  `no-store`. `submitCheckout` spreads `paymentUrl` conditionally so the key is
  absent rather than `undefined`
- `lib/format/money.ts` — `formatPrice`
- `tests/fixtures/catalog.ts` and 23 tests across `client`, `errors`, `catalog`
  and `money`

---

## Remaining

None.

---

## Decisions

### Decision: the caching directive is required by the type

**Decision**

`RequestOptions` is a union that requires either `revalidate` or
`cache: "no-store"`. There is no default.

**Reason**

Next's own default has changed between major versions, and a call that inherits it
is a call whose cost nobody has thought about. ADR 0001's throttle budget is a sum
over explicit intervals; a call that is not in the sum breaks the arithmetic
silently.

**Consequence**

Every call site states its policy, including the obvious ones. Adding an endpoint
means deciding how long its answer is good for, which is the right question to be
forced to answer.

### Decision: responses are typed but not validated at runtime

**Decision**

No schema library. API responses are typed and trusted; `localStorage` is parsed
and validated.

**Reason**

The backend is a first-party service with pinned codes, an explicit field contract
and a published OpenAPI schema. A field that disappears is a bug to fix in both
repositories, not a runtime condition to degrade around, and it surfaces as a
render failure with a clear stack. Validating every product on every request would
add a dependency and a per-item cost to defend against a class of failure that has
a better fix.

`localStorage` is genuinely untrusted — hand-editable, versioned, possibly written
by older code — and is validated for that reason.

**Consequence**

This departs from the `typescript-best-practices` skill's "external data is
`unknown`" rule, deliberately and with the reason recorded. The trigger to revisit
is a third boundary, or a cart parser that stops being obviously correct at a
glance; at that point adopt one library and convert every boundary together.

### Decision: no generated client

**Decision**

`lib/api` is written by hand against
[backend-api.md](../integrations/backend-api.md), not generated from
`/api/schema/`.

**Reason**

A generated client would give exact types for free and would catch a contract
change at build time, which is real value. It generates the whole surface,
including endpoints the storefront must not call, and it cannot express the two
things this module exists to enforce — which calls run on the server and which in
the browser, and what each one's caching directive is. It would also put a
codegen step and its output into a repository that currently has neither.

**Consequence**

The types are maintained by hand and can drift. The OpenAPI schema is the
cross-check: comparing `lib/api/types.ts` against it is a real review step when the
backend changes.

### Decision: no retries, ever

**Decision**

A failed request throws. Nothing retries, with or without backoff.

**Reason**

Every endpoint is rate-limited per IP, and three of them at low rates. A retry
against a 429 spends the customer's remaining budget; a retry against a checkout
that timed out after the order was placed can place a second order.

**Consequence**

Transient network failures reach the customer. The mitigation is a retry *the
customer* chooses, on a screen that has kept their input.

---

## Gotchas

- **In development the API returns *relative* image URLs.** `config/settings/local.py`
  on the backend overrides the storage backend to the filesystem, so
  `primary_image.url` is `/media/products/foo.jpg`; production is Cloudinary and
  absolute. A relative URL handed to `next/image` resolves against the
  storefront's own origin and 404s. `toAbsoluteImageUrl` in the mapping layer is
  the whole fix, and `next.config.ts` has to allow both hosts.
- **`localhost` is not `127.0.0.1` here.** `localhost` resolves to `::1` first,
  and anything bound to `[::]:8000` — a container, typically — shadows a Django
  dev server on IPv4. `.env.local` uses `127.0.0.1` for that reason.
- **The base URL is chosen at call time, not at import time.** `typeof window ===
  "undefined"` is evaluated inside `request`, because the same module is bundled
  for both runtimes.
- **Locally the two base URLs are identical**, so calling a browser-only endpoint
  from the server works perfectly in development and fails in production with a
  CORS error and no server-side trace. The split is real even when the values match.
- **Every path ends in a trailing slash.** Django redirects one that does not, and
  a redirected `POST` can arrive as a `GET`.
- **`payment_url` is absent, not null.** Modelling it as `string | null` produces a
  type that is wrong in a way TypeScript will not catch, because the key simply is
  not there.
- **`variant_unavailable` carries `variant_ids`, plural, as a list.**
  `insufficient_stock` carries `variant_id`, singular, as a string. The two details
  shapes are different and the singular one is the easy mistake.
- **`next` and `previous` in a page envelope are absolute URLs built from the
  request's host.** A server-rendered call gets the internal host in them. Never
  follow them from the browser; recompute `limit` and `offset`.
- `listCategories` returns a bare array. Code written against `Page<T>` will read
  `undefined` from it and render nothing, with no error.
- **A 404 from `getProduct` is a normal condition**, not an exception to log. The
  route turns it into `notFound()`.
- An empty or whitespace-only query value must be dropped, not sent. `?search=`
  mints a distinct cache key for the same results.
- The `Money` alias is `string`. A function that accepts `Money` will accept any
  string, so the discipline is in review and in the single formatter, not in the
  compiler.

---

## Routes

```text
None.
```

---

## API

### Calls

```text
GET  /api/v1/products/            server,  revalidate 300
GET  /api/v1/products/{slug}/     server,  revalidate 900
GET  /api/v1/categories/          server,  revalidate 3600
POST /api/v1/checkout/            browser, no-store
GET  /api/v1/orders/{token}/      browser, no-store
POST /api/v1/orders/lookup/       browser, no-store
```

### Errors handled

This module handles none of them. It names failures and throws; deciding what a
customer sees belongs to the feature that made the call. The code → treatment
table is in [architecture.md](../architecture.md#error-handling).

---

## State and data

```text
None. This module holds no state and caches nothing of its own.
```

---

## Accessibility

```text
None. No user-facing surface.
```

---

## Tests

- `lib/api/errors.test.ts` — the envelope parser: a well-formed error, a body that
  is not JSON, a JSON body with no `error` key, a missing `X-Request-ID`, and that
  `details` is always an object
- `lib/api/client.test.ts` — base URL selection on both sides, trailing slashes,
  query building with absent and empty values, and that a 2xx returns the payload
  unwrapped
- `lib/api/catalog.test.ts` — the mapping functions, including a product with
  `primary_image: null` and a variant whose `price` differs from its product's
  `base_price`
- `lib/api/orders.test.ts` — that a cash-on-delivery `CheckoutResult` has no
  `paymentUrl` key at all
- `lib/format/money.test.ts` — grouping at four and five digits, a non-zero paisa
  value, and that `formatPrice` never returns `NaN`

Fixtures live in `tests/fixtures/` and are typed with these same types, so a
contract change breaks them at compile time. `fetch` is stubbed directly; there is
no MSW.

---

## Files

```text
lib/env.ts
lib/api/client.ts
lib/api/errors.ts
lib/api/types.ts
lib/api/catalog.ts
lib/api/orders.ts
lib/format/money.ts
tests/fixtures/
docs/integrations/backend-api.md      the contract this mirrors
```

---

## Future context

This module is where the backend contract becomes TypeScript, and the mapping
functions are the seam. When the backend changes a field, the compiler should fail
in `lib/api/types.ts` and nowhere else — if a change ripples into components, a
field name has escaped the boundary and should be brought back.

The caching directives are not independent settings. They are the terms of ADR
0001's throttle sum, and changing one, or adding a seventh server-side call, means
re-doing that arithmetic before merging.

When Phase 2 adds customer accounts, this is the module that grows an
`Authorization` header, and the server/browser split will need re-arguing rather
than extending — a session token on the server has the same exposure problem as an
access token.
