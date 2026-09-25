# Order status

Status: Implemented

Last updated: 2026-09-25

---

## Goal

Let a customer see an order they placed: from the link in their confirmation email,
or by order number and email when the link is lost.

---

## Scope

What is included in this implementation?

- `/orders/[accessToken]`: the order behind a token, fetched from the browser
- `/orders/lookup`: the order-number-and-email fallback, prefilled from this device
- Status copy for `pending`, `confirmed`, `shipped`, `delivered`, `cancelled`

What is explicitly outside the scope?

- Order history across devices, cancellation, returns (the API has none)
- The Khalti success and failure landings, removed with online payment

---

## Context

- `GET /api/v1/orders/{access_token}/` and `POST /api/v1/orders/lookup/`, both from
  the browser (ADR 0001). See [backend-api.md](../integrations/backend-api.md#orders).
- Backend ADR 0011: cash on delivery only, and `paid` became `confirmed`. The merchant
  confirms a `pending` order, usually by phone, before it ships.

---

## Implemented

- `app/orders/[accessToken]/page.tsx` — a server shell, `noindex`, around
  `OrderByToken`.
- `components/orders/OrderByToken.tsx` — waits for hydration, then fetches the order.
  The promise is created in a component that never suspends and read with `use()`
  inside a `Suspense` boundary. A found order is recorded on this device (order
  number, email, amounts). A mounted `role="status"` region announces the outcome.
- `components/orders/OrderView.tsx` — the order number, a status `Badge` with a
  sentence of what it means, the date, the lines as "Size · Shade" (size alone when
  shadeless), the API's subtotal, shipping and total, "Cash on delivery", and the
  delivery address.
- `components/orders/LookupForm.tsx` — `Field`s for order number and email,
  prefilled from the latest local record, a destructive `Alert` for failures that
  never names a field, and a list of orders placed on this device, each viewable in
  one press.
- `app/orders/lookup/page.tsx` — `noindex`.
- `next.config.ts` — `X-Robots-Tag: noindex, nofollow` on `/orders/*`, and a
  `same-origin` referrer policy on every response.

---

## Remaining

None.

---

## Decisions

### Decision: the order is fetched in the browser, never on the server

**Decision**

The token route renders only a loading shell on the server.

**Reason**

The access token is a credential in the path; a server-side fetch would put it in a
server log, and the 60/hour limit must land on the customer's IP (ADR 0001).

**Consequence**

The page cannot show the order without JavaScript.

### Decision: `pending` reads as placed, never as confirmed

**Decision**

`pending` is labelled "Placed", with "the shop will call you to confirm it".

**Reason**

Under cash on delivery nothing is confirmed until the merchant says so.

**Consequence**

"Confirmed" appears only when the API says `confirmed`.

### Decision: the lookup form is prefilled from the local record

**Decision**

The latest order this device placed fills both fields.

**Reason**

The API answers a wrong email and an unknown number identically, at twenty attempts
an hour; guessing which address was used spends that budget without learning
anything.

**Consequence**

The record holds an email address in `localStorage`, never a token.

---

## Gotchas

- **`/orders/{accessToken}` is a cross-repository contract.** Every confirmation
  email links there; renaming it strands customers and fails no test.
- **`access_token` is a bearer credential.** It is never logged, stored, announced
  or rendered, and no third-party script runs on `/orders/**`.
- **A wrong token returns 404, never 403**, identical to an unknown one. The copy
  says "we could not find that order", never that the link is wrong.
- **The lookup's 404 is identical for a wrong email and a nonexistent order.**
  Never write "that email does not match".
- **The token is in the page's HTML regardless**, inside Next's flight payload. The
  rule is that nothing we write contains it.
- **The promise must be created outside the suspending component**, or it is
  recreated on every retry: an endless refetch against a 60/hour limit.
- **`variant_shade` is `""` on the wire for a shadeless line**; `lib/api/orders.ts`
  turns it into `null`.
- Line items are snapshots with no variant id; a product renamed since shows its old
  name, correctly.

---

## Routes

```text
/orders/[accessToken]    dynamic shell; client fetch; noindex; same-origin referrer
/orders/lookup           static shell; client form; noindex
```

---

## API

### Calls

```text
GET  /api/v1/orders/{access_token}/    browser, no-store
POST /api/v1/orders/lookup/            browser, no-store
```

### Errors handled

| `code` | Treatment |
| --- | --- |
| `not_found` | "We could not find that order", with the lookup offered |
| `throttled` | Explains the hourly limit; nothing is wrong with the order |
| no response | "We could not reach the shop", distinct from not found |
| anything else | A generic message with the request id |

---

## State and data

- `localStorage` `tl.orders.v1` — up to ten `{ orderNumber, email, recordedAt,
  paymentMethod, amounts }`, newest first, validated entry by entry on read.

---

## Accessibility

- The token route's status region is mounted before its text changes, so the
  outcome is announced.
- The lookup moves focus to "Order found" when the order replaces the form, and
  back to the order number field when the form returns.

---

## Tests

- `components/orders/OrderByToken.test.tsx` — the fetch is uncached and by token;
  `confirmed` and `pending` read correctly and `pending` never says confirmed;
  "Size · Shade" and size alone; the order is recorded without the token; 404, 429
  and transport failures read differently; the token never renders.
- `components/orders/LookupForm.test.tsx` — prefill, submit, one-press lookup of a
  recent order, and failure copy that names no field.
- `tests/e2e/buy-flow.spec.ts` — a `confirmed` order by token, `noindex`, no token in
  the page.

---

## Files

```text
app/orders/
components/orders/
lib/api/orders.ts
lib/orders/record.ts
```
