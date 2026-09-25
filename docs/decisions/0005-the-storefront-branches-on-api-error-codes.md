# ADR 0005: The storefront branches on the API's error codes, never its messages

Status: Accepted

Date: 2026-09-21

Supersedes: None

---

## Context

Every failure from the backend, on every endpoint, arrives in one envelope:

```json
{
  "error": {
    "code": "insufficient_stock",
    "message": "Not enough stock to fulfil this order.",
    "details": { "variant_id": "1b7d...", "requested": 3 }
  }
}
```

The backend is explicit about which half of that is a contract. It maintains a
literal map from exception class to published code, rather than reading the code
its HTTP framework happens to generate, specifically so that a library upgrade
cannot rename one without someone noticing. Its own conventions state that `code`
is part of the public API and that renaming one is a breaking change, while
`message` is written for humans and may be reworded freely.

The storefront has to make decisions from these failures, and they are not uniform
decisions. A 422 at checkout can mean four different things, each needing different
copy and a different next step: send the customer back to the cart, name one line,
show an order number, or show a phone number. A 404 on a product page is a
`notFound()`; a 404 on an order lookup is "we could not find that order" and must
*not* say why.

Status codes do not carry enough to tell these apart — four distinct outcomes share
422 — and messages carry it only by accident.

## Decision

**`code` is the only thing the storefront branches on.**

`lib/api` parses the envelope once and throws a single error type:

```ts
class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details: Record<string, unknown>;
  readonly requestId: string | null;
}
```

No component reads a status code, and no component matches on message text or
substring.

The mapping from code to treatment is a **single table**, in
[architecture.md](../architecture.md#error-handling), and it is the one place a new
code is added.

`message` may be **displayed** where it is known to be useful — a
`validation_error`'s field messages are written for exactly that — but it is never
**inspected**.

A code with no row in the table reaches the generic error boundary rather than
being guessed at.

## Reason

The backend has already done the work of making codes stable and said so in
writing. Branching on anything else discards a guarantee that was deliberately
constructed, in favour of one that was not: nobody on the backend is going to treat
rewording "Not enough stock to fulfil this order." as a breaking change, and they
are right not to.

The status code is insufficient on its own, and this is not theoretical.
`variant_unavailable`, `insufficient_stock`, `payment_gateway_unavailable` and
`payment_amount_mismatch` are all 422, and the correct response to each is
different — the third one in particular means *an order was successfully placed*,
which is close to the opposite of what a 422 usually implies.

Keeping the mapping in one table rather than scattered across `catch` blocks is
what makes it auditable. There are around a dozen reachable codes; the question
"what does the storefront do when the gateway is unavailable" should have one
answer findable in one place, and a code the storefront has never handled should be
identifiable by its absence from a list rather than by its absence from every
component.

Letting an unmapped code fall to the boundary is the safe default. The alternative
— a `catch` that renders a friendly message for anything — turns a novel failure
into a shrug, and novel failures are the ones worth seeing.

## Alternatives considered

### Branch on HTTP status

Why it was not chosen: it is the conventional approach and it works for 404, 429
and 500. It cannot distinguish the four 422s, which are precisely the failures with
the most customer impact and the most divergent handling. Using status for some
branches and code for others would mean two vocabularies and a rule about which
applies where.

### Show the API's `message` for everything and branch on nothing

Why it was not chosen: it is genuinely tempting, because the backend's messages are
well written and customer-appropriate. It fails because the decision is not only
what to *say* — it is where to send the customer next. "The order was placed but
payment could not be started" is a good sentence attached to a completely wrong
page if the storefront treats it as a generic checkout failure and invites a retry
that would place a second order.

### Generate a TypeScript union of codes from the backend's OpenAPI schema

Why it was not chosen: it would make an unhandled code a compile error, which is
the strongest version of this decision. The schema is generated from view
signatures and does not enumerate `DomainError` subclasses per endpoint, so the
union would be incomplete in exactly the places that matter. Worth revisiting if
the backend ever publishes its error codes in the schema.

### A typed error subclass per code

Why it was not chosen: `class InsufficientStockError extends ApiError` reads
nicely and allows `instanceof` narrowing. It requires a constructor lookup keyed by
code — which is the same table, plus a dozen classes — and a code the backend adds
tomorrow has no class, so the fallback path is needed anyway. One class and a
string discriminant carries the same information with less machinery.

## Consequences

### Positive

- Copy changes on the backend never break the storefront.
- Every failure has one designed treatment, findable in one table, reviewable
  without reading component code.
- The four 422s are distinguishable, which is what makes the checkout error states
  correct rather than merely present.
- An unhandled failure is visible as an unhandled failure rather than being
  absorbed into a generic message.

### Negative

- **The table is a second place to update when the backend adds a code**, and
  nothing in either repository enforces that it is updated. A new code silently
  falls to the generic boundary until someone notices.
- The storefront must not display a `server_error` message, so a real failure shows
  generic copy and the customer has less to report — mitigated by surfacing the
  request id.
- Codes are strings, so a typo in a comparison compiles and silently never matches.
  A frozen constant per handled code mitigates it; a generated union would remove
  it.

### Constraints introduced

- **`lib/api` throws `ApiError` and never returns a status code or a raw
  envelope.** Nothing above it reads `response.status`.
- **No `catch` matches on `message` text**, including with `includes` or a regular
  expression.
- **The code → treatment table lives in `architecture.md` only.** A second copy
  will drift; feature documents link to it.
- **A new code means a new row**, added in the same change that starts handling it.
- **A `catch` handles the codes its call can actually produce and rethrows the
  rest.** A blanket catch is rejected in review.
- `insufficient_stock` handling must never state a remaining quantity — the API
  omits it deliberately, and inventing one from a stale cache would publish what
  the backend refuses to.
- A transport failure produces no `ApiError` and must be distinguished from one.

## Implementation

```text
lib/api/errors.ts            ApiError and the envelope parser
lib/api/client.ts            the only throw site
docs/architecture.md         the code → treatment table
docs/integrations/backend-api.md   the codes the API can send, and their details shapes
components/checkout/         the four 422 treatments
app/orders/failed/page.tsx   branches on the `reason` query parameter, same vocabulary
app/error.tsx                the generic boundary and the request id
```

The failure page for a Khalti payment is worth noting: the backend redirects to
`/orders/failed?reason=<code>`, putting a domain code in a query parameter. That is
the same vocabulary arriving by a different transport, and it is handled by the
same table.

## Future reconsideration

Revisit if the backend publishes its domain error codes in the OpenAPI schema. A
generated union would turn an unhandled code into a compile error and remove the
string-typo risk, which is the main weakness of this decision.

Revisit if the number of handled codes grows past what one table can be read in one
sitting. The split would be by feature rather than by status, and each feature
document would own its own section — but only once the single table is genuinely
unwieldy, not before.
