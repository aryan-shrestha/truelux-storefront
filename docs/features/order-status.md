# Order status

Status: Implemented

Last updated: 2026-09-24

---

## Goal

Let a customer see an order they have placed, and catch the browser the backend
redirects here after a Khalti payment — successfully or otherwise.

---

## Scope

What is included in this implementation?

- `/orders/[accessToken]` — the success landing for a Khalti payment, and the
  order view
- `/orders/failed` — the failure landing, branching on `?reason=`
- `/orders/lookup` — the order-number and email fallback
- The prefill and recent-order list from the local order record
- The credential hygiene these routes require
- Clearing the cart when the order this browser handed to Khalti lands

What is explicitly outside the scope?

- Placing an order, which belongs to `checkout.md`
- Cancelling, returning, or changing an order. The API offers no endpoint
- Order history across devices. There are no accounts
- Anything that talks to Khalti. The storefront never does

---

## Context

**This feature is a contract with the backend repository.** Its own documentation
says so:

> The storefront must serve `/orders/<access_token>` and `/orders/failed`. That
> is now a contract between the two repositories, and nothing in this one enforces
> it.

After a Khalti payment, Khalti redirects the browser to the backend's return
endpoint. The backend verifies the payment server-to-server — the only
verification there is, because Khalti sends no webhook — and then issues a 302:

```text
success  →  {storefront}/orders/{access_token}
failure  →  {storefront}/orders/failed?reason=<code>
```

If either route is missing, a customer who has just paid lands on a 404.

`reason` carries a domain error code, so the failure page branches on the same
vocabulary as every API call
([ADR 0005](../decisions/0005-the-storefront-branches-on-api-error-codes.md)). It
can be `payment_not_completed`, `payment_amount_mismatch` or
`payment_gateway_unavailable`.

The `access_token` in that URL **is the credential**. Possession of it is the
entire authorization story for reading the order, which makes this the one part of
the storefront with security rules of its own.

And for cash-on-delivery customers, none of this happens. There is no redirect —
but the backend now emails them the same
`{STOREFRONT_URL}/orders/{access_token}` link when the order is placed, which
supersedes [ADR 0006](../decisions/0006-the-storefront-keeps-its-own-order-record.md).
`/orders/lookup` is the fallback when that email never arrives, at twenty
attempts an hour, the lowest rate limit in the system.

---

## Implemented

The three routes, the shared order view, and the handoff marker that decides when
the landing clears the bag. Verified with unit tests against stubbed `fetch` and
with the Playwright Khalti path; **not yet against the real backend** (see
Remaining).

### `/orders/[accessToken]`

A server shell with a client component that fetches the order from the browser.
Fetching it on the server would put a bearer credential through a Vercel function
and its logs, which
[ADR 0001](../decisions/0001-the-browser-makes-every-customer-scoped-call.md)
rules out.

This route is arrived at **mid-journey, immediately after a payment**, by a
customer who has just spent money and does not yet know whether it worked. Its
loading state is therefore a designed surface, not a spinner: the page says that
the payment is being confirmed while the fetch is in flight.

On success it renders the order: number, status, the placed date, the line items
with their snapshot names and prices, the shipping address, and the confirmed
`subtotal`, `shipping_fee` and `total`.

It **clears the cart only when the handoff marker names this order** —
`lib/orders/handoff.ts`, written by checkout immediately before
`location.assign(payment_url)` and consumed here. The same URL arrives from every
confirmation email, so "arrived here" no longer means "just paid for this bag".
The clear is idempotent and does not assume the cart is non-empty.

The order is written to the local order record — keeping the original
`recordedAt` if it is already there — so the lookup can offer it later.

The fetch waits for hydration and uses React's `use()` on a promise created in a
component that never suspends (`OrderLoader`), not a `useEffect`. The promise
resolves to a result union and never rejects, so no error boundary is needed. A
persistent `role="status"` region announces the outcome.

`status` is one of `pending`, `paid`, `shipped`, `delivered`, `cancelled`, and
each gets plain copy. `pending` after a successful payment redirect is possible —
verification can leave an order unpaid — and must not be described as confirmed.

### `/orders/failed`

Static, server-rendered, reading `?reason=`:

| `reason` | Copy |
| --- | --- |
| `payment_not_completed` | The payment did not go through and nothing was charged. The order is waiting; contact the shop or place it again as cash on delivery |
| `payment_amount_mismatch` | Something went wrong with the amount. Nothing the customer can fix, so this one leads with contact details |
| `payment_gateway_unavailable` | The gateway could not be reached |
| absent or unrecognised | Generic: the payment did not complete |

Every branch says what to do next. **None offers a retry**, because there is no
retry-payment endpoint and the only thing a retry could do is place a second
order.

The page cannot name the order — the backend's redirect carries no order number on
this path — so it points at the lookup and, where the local record has a recent
order, names it (`components/orders/RecentOrder.tsx`, a client island).

It also **discards the handoff marker**. The handoff ended without a payment, and a
marker left behind would clear whatever bag the customer has on the day they open
this order's email link.

`payment_not_completed` also links to `/checkout` as cash on delivery, as the copy
table says. The others do not, because a payment may have happened.

### `/orders/lookup`

The fallback for a customer whose confirmation email never arrived, or who
deleted it.

A two-field form, `order_number` and `email`, posted from the browser. Both are
**prefilled from the most recent local order record**: twenty attempts an hour is
generous until a customer is guessing which email they used, at which point it is
a lockout.

Below the form, the orders this device has placed, each a one-click lookup.

On success it renders the same order view as the token route under an "Order
found" heading that takes focus; "Look up another order" returns focus to the
order-number field.

### The order view

One component, shared by both routes, taking an `Order`. Line items carry
**snapshots** — `product_name`, `variant_size`, `variant_color`, `sku` — which are
text copied at purchase time and do not link back to a product page. There is no
variant id in the response, so there is nothing to link to even if it were wanted.

---

## Implemented

---

## Remaining

- **Not verified against the real backend.** Its CORS allow-list is
  `https://example.com` only, so a browser on `localhost:3000` cannot call the
  order endpoints. Same blocker as checkout (#7).
- **There is no contact channel.** The failure copy says the shop "has your
  contact details" and will get in touch, because the storefront has no phone,
  email or social link to offer and inventing one is out of bounds. When the
  merchant supplies one, `/orders/failed` and the pending-Khalti status copy are
  where it belongs.

One condition that cannot be met from this repository:

- **The backend's `STOREFRONT_URL` must point at this storefront's origin**,
  or the redirect after payment lands somewhere else entirely. That setting lives
  in the backend's environment, and nothing in either repository checks that it
  agrees with reality.

---

## Decisions

### Decision: the order is fetched in the browser, never on the server

**Decision**

`/orders/[accessToken]` renders a server shell and fetches the order client-side.

**Reason**

The token is a bearer credential in a URL path. A server render puts it in a
Vercel function's request path, which means in Vercel's logs, which is a second
place it can leak from for no benefit. The 60-per-hour `anon` rate limit on that
endpoint is a second reason: server-rendered, it would be shared by every customer
returning from a payment.

**Consequence**

The page a customer reaches immediately after paying has no server-rendered
content, so its loading state is the first thing they see. That state has to say
"confirming your payment" rather than showing an empty frame.

### Decision: the failure page offers no retry

**Decision**

No branch of `/orders/failed` offers a way to pay again.

**Reason**

There is no retry-payment endpoint. A retry button could only call checkout again,
which places a second order and decrements the same stock a second time.

**Consequence**

The customer's route forward is cash on delivery or contacting the merchant, and
the copy has to make that feel like a path rather than a dead end.

### Decision: the lookup form is prefilled from the local record

**Decision**

`order_number` and `email` are prefilled from the most recent order this device
placed, and recent orders are listed.

**Reason**

The lookup is rate-limited at twenty an hour and returns an identical 404 for a
wrong email and a nonexistent order. A customer guessing between two addresses
exhausts their attempts without ever learning which part was wrong.

**Consequence**

This was first argued from
[ADR 0006](../decisions/0006-the-storefront-keeps-its-own-order-record.md), now
superseded by the confirmation email; the rate-limit argument above stands on its
own. The record is a convenience and never a credential — every lookup still goes
through the API with the email. A cleared browser or a second device gets an empty
form, which is the case most likely to end in a support message.

### Decision: the landing clears the cart only for the handed-off order

**Decision**

`/orders/[accessToken]` clears the cart only when `tl.handoff.v1` names the order
it loaded. Checkout writes the marker just before sending the browser to Khalti;
the landing consumes it; `/orders/failed` discards it.

**Reason**

`checkout.md` leaves the bag intact through the Khalti handoff, so a customer who
abandons the hosted page still has something to act on. The original plan cleared
on any successful load, which was right while only the Khalti redirect reached
this route. Once the backend started emailing the same link for every order, it
would have emptied whatever bag a customer had built since, the day they opened
their confirmation.

**Consequence**

A second storage key, versioned like the others and holding an order number, never
the token. A payment completed in a different tab or browser from the one that
checked out leaves the bag alone — the safe direction to be wrong in.

---

## Gotchas

- **These two routes are a cross-repository contract.** Renaming either breaks
  paid customers, and nothing in either repository will fail a test.
- **`access_token` is a bearer credential.** It is never logged, never put in an
  error message, never sent to any analytics, and never written to storage.
- **No third-party scripts on `/orders/**`.** Anything that sees the full path
  sees the credential. This includes analytics, a tag manager, a chat widget, and
  any font or script loaded from another origin.
- **These routes are `noindex`**, and the referrer policy is `same-origin`. A
  crawler that reaches one has been handed a live credential, and an outbound link
  would leak it in a `Referer` header.
- **The order response never echoes `access_token`.** Do not look for it and do
  not render it.
- **A wrong token returns 404, never 403.** So does an unknown one. The page must
  not distinguish them.
- **The lookup's 404 is identical for a wrong email and a nonexistent order**, and
  this is deliberate — a distinguishable response confirms which email placed
  which order. **Never write "that email does not match".**
- **`status` can be `pending` on the success landing.** The redirect means the
  backend verified *something*; it does not guarantee `paid`. Read `status` and
  say what it says.
- **The return round trip is slow.** The backend calls Khalti server-to-server
  before redirecting, so a customer may sit on Khalti's page for seconds. This
  page then has its own fetch on top of that.
- **Refreshing the success URL is safe and will happen.** The backend's
  verification is idempotent on `pidx`, and this page is a plain read.
- **The token is in the page's HTML regardless**, inside Next's flight payload,
  which carries the route segments. That is the URL restated in the same document,
  not a new place for it to go; the rule is that nothing *we* write — copy,
  storage, announcements, logs — contains it.
- **The promise must be created outside the suspending component.** Created in
  `OrderResult`'s own state, it is discarded when that render suspends and
  recreated on retry: an endless refetch against a 60/hour limit. StrictMode
  in development still fetches twice.
- Line items are snapshots with no variant id. There is nothing to link back to,
  and a product renamed since purchase shows its old name — correctly.
- The `anon` rate on the token endpoint is 60/hour per IP, lower than the
  catalogue's. A customer refreshing repeatedly can throttle themselves.

---

## Routes

```text
/orders/[accessToken]    server shell, browser fetch, dynamic, noindex
/orders/failed           server-rendered static, dynamic on ?reason=, noindex
/orders/lookup           server shell, browser fetch, dynamic, noindex
```

The first two are the routes the backend's Khalti return redirects to. They are
not optional.

---

## API

### Calls

```text
GET  /api/v1/orders/{access_token}/     browser, no-store
POST /api/v1/orders/lookup/             browser, no-store
```

### Errors handled

| `code` | Route | Treatment |
| --- | --- | --- |
| `not_found` | token | "We could not find that order." No suggestion that the token might be wrong — it may simply be someone else's URL |
| `not_found` | lookup | "We could not find an order with that number and email." **Never** attribute the failure to one field |
| `throttled` | lookup | Say the limit is low and to try again later. Twenty an hour is easy to hit while guessing |
| `throttled` | token | Same, phrased for someone refreshing |
| transport failure | both | Distinguish from a 404. "We could not reach the store" is a different fact from "no such order" |

---

## State and data

| Tier | Holds |
| --- | --- |
| URL path | The access token, for the life of the page view. It goes nowhere else |
| URL search params | `?reason=` on the failure page |
| `localStorage` | Reads and appends `tl.orders.v1`; consumes `tl.handoff.v1` and, when it matches, clears `tl.cart.v1` |
| React state | The fetch state, the lookup form |

**The access token is never written to storage**, never appended to the order
record, and never leaves the page it arrived on.

---

## Accessibility

- The order view is a description list, not a table of unlabelled figures, so
  every value is read with what it means.
- The loading state on the success landing is announced through a polite live
  region — a customer using a screen reader after paying needs to hear that
  something is happening.
- The order number is selectable text at display size, so it can be copied and
  read aloud over the phone.
- The lookup form's fields carry real labels, and its failure is announced
  assertively and associated with the form rather than with either field —
  because the API deliberately does not say which one was wrong.
- The failure page leads with what happened and what to do, in that order, so the
  first thing announced is the fact rather than the heading style.
- Order status is a word, never a coloured dot.

---

## Tests

- `components/orders/OrderByToken.test.tsx` — URL and `no-store`; renders the
  API's figures; `pending` Khalti is not called paid or confirmed; the bag clears
  only with a matching marker, and once; an email-link arrival leaves it alone;
  safe on an empty bag; records the order and never the token; `not_found`,
  `throttled` and unreachable copy, told apart; **no rendered output contains the
  token**, in any state
- `app/orders/failed/page.test.tsx` — each `reason` has its own heading; absent,
  unknown and repeated reasons fall back to generic; no branch has a button or
  retry wording; cash on delivery offered only for `payment_not_completed`; names
  the latest local order and discards the marker
- `components/orders/LookupForm.test.tsx` — prefill; request body and
  `no-store`; focus moves to the result; a 404 blames neither field and marks
  neither invalid; 429 copy; a recent order looks up in one click
- `lib/orders/handoff.test.ts`, `lib/format/date.test.ts`
- `tests/e2e/buy-flow.spec.ts` — Khalti checkout to the landing: order shown, bag
  emptied, token absent from `main`, `noindex` present

---

## Files

```text
app/orders/[accessToken]/page.tsx
app/orders/failed/page.tsx
app/orders/lookup/page.tsx
components/orders/OrderView.tsx
components/orders/LookupForm.tsx
components/orders/OrderByToken.tsx
components/orders/RecentOrder.tsx
lib/api/orders.ts               getOrder, lookupOrder; RawOrder exported for fixtures
lib/orders/record.ts            prefill and the recent list
lib/orders/handoff.ts           when the landing may clear the bag
lib/format/date.ts              the placed date, in Kathmandu time
tests/fixtures/orders.ts
```

---

## Future context

The two redirect targets are the most brittle thing in either repository: a rename
here breaks customers who have already paid, and no test in either project would
notice. If these routes ever move, it is a coordinated change with the backend's
`STOREFRONT_URL`.

The credential rules on these routes are not general good practice — they exist
because an access token is a bearer credential travelling in a URL, and the
backend accepted that exposure deliberately in exchange for guest checkout. This
storefront's job is not to widen it. The test asserting no rendered output
contains the token is the cheapest guard available and should not be deleted as
redundant.

The backend shipped confirmation email on 2026-09-23, so the lookup is a fallback
rather than the only route back, and ADR 0006 is superseded. The prefill stays:
it is cheap, and the send is best-effort with no signal to the storefront, so
"the email arrived" is not something this repository can assume.
