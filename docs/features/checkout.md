# Checkout

Status: Implemented

Last updated: 2026-09-24

---

## Goal

Turn a browser cart into a placed order: collect contact and address details,
submit them from the customer's own browser, and handle the five ways the backend
can refuse — including the one where it refuses and places the order anyway.

---

## Scope

What is included in this implementation?

- `/checkout` — the form, submitted from the browser
- The district picker, and why it is a picker
- Payment method selection: cash on delivery, or Khalti
- The handoff to Khalti's hosted page
- `/checkout/confirmation` — for cash on delivery, and the only place a COD
  customer sees their order number
- Every error treatment, including `payment_gateway_unavailable`
- Writing the local order record
- Clearing the cart, at the right moment

What is explicitly outside the scope?

- The cart itself, which belongs to `cart.md`
- The Khalti return landing pages, which belong to `order-status.md`
- Any price, total or shipping calculation. The backend owns all three
- Discount codes, gift cards, tax — the API has none
- Address validation against a postal database

---

## Context

`POST /api/v1/checkout/` is the only write in the entire storefront, and it is
made **from the customer's browser**
([ADR 0001](../decisions/0001-the-browser-makes-every-customer-scoped-call.md))
so that the 30-per-hour rate limit applies to a person rather than to the shop.

Several properties of that endpoint shape this feature before any design work:

- It **accepts no price field**, and ignores one if sent. Prices, the shipping fee
  and the total are re-resolved server-side inside a row lock.
- It **decrements stock at placement**, before payment. An order exists and holds
  inventory from the moment it returns 201.
- Its response carries `order_number`, `status`, `subtotal`, `shipping_fee`,
  `total`, and `payment_url` **only for Khalti** — the key is absent for cash on
  delivery, not null.
- It **never returns `access_token`**, and there is a backend test asserting that.
- `district` is **free text** and decides the shipping band. Anything that is not
  `kathmandu`, `lalitpur` or `bhaktapur` — case-insensitively — is charged the
  outside-valley rate, silently.
- `payment_gateway_unavailable` is a 422 that means **the order was placed**. It
  is the one error in the system where a failure response describes a success.

[ADR 0006](../decisions/0006-the-storefront-keeps-its-own-order-record.md) is
**superseded**, and the reason matters here. The backend now sends a confirmation
email from inside `place_order`, for both payment methods, linking to
`{STOREFRONT_URL}/orders/{access_token}`. A cash-on-delivery customer does
receive a way back to their order.

What survives is narrower. `send_email` catches everything and never raises, so a
failed send does not fail the order and **nothing tells the storefront either
way**. The confirmation page still shows the order number prominently, because a
customer who mistyped their address has that and the lookup and nothing else.

---

## Planned

### The route

`app/checkout/page.tsx` renders a server shell; `components/checkout/CheckoutForm`
is a client component that owns the cart, the form and the submission. Nothing
about this route is server-rendered or cached.

If the cart is empty after hydration, the page offers the listing rather than an
empty form.

### The form

Native `<form>`, real `name` attributes, one field per API field:

| Field | Control | Notes |
| --- | --- | --- |
| `full_name` | text, max 200 | |
| `email` | email | Also stored in the local order record, for the lookup prefill |
| `phone` | tel, max 32 | No format validation — the API accepts any string |
| `address_line` | text, max 255 | |
| `city` | text, max 100 | |
| `district` | **select**, max 100 | A fixed list. See Decisions |
| `note` | textarea, max 1000 | Optional |
| `payment_method` | radio | `cod` or `khalti` |

An order summary sits beside the form: the cart lines and their prices, and **no
total**. In its place, one line of copy from `NEXT_PUBLIC_SHIPPING_NOTE`
describing the shipping bands, and a statement that the final figure is confirmed
when the order is placed.

Client-side validation mirrors the API's rules as a courtesy. The server's 400 is
the real validation, and its `details` object is keyed by field name, so its
messages render inline against the matching field.

### Submission

```text
submitCheckout({ items, ...contact, paymentMethod })
    ↓ 201
  khalti  →  write the local order record  →  write the handoff marker
             →  location = payment_url
  cod     →  write the local order record  →  clear the cart
             →  /checkout/confirmation
```

**The cart is cleared only on the cash-on-delivery path**, and only after the
order record is written. On the Khalti path the cart is left alone until the
return lands on `/orders/{accessToken}` — which clears it only when the handoff
marker (`lib/orders/handoff.ts`, `tl.handoff.v1`) names that order, because a customer who abandons the
hosted payment page and comes back should still have their bag — the order exists
and holds stock either way, but an empty cart and no order page would leave them
with nothing at all.

`payment_url` is read with an existence check, not a null check. A Khalti response
without one is a contract violation and is treated as a gateway failure rather
than as a redirect to `undefined`.

### Error treatments

| `code` | Status | Treatment |
| --- | --- | --- |
| `validation_error` | 400 | Inline field messages from `details`. The form keeps everything typed |
| `variant_unavailable` | 422 | `details.variant_ids` is a **list**. Name each affected line, offer to remove them, send the customer back to the cart. No order was placed |
| `insufficient_stock` | 422 | `details.variant_id` is a **single string**. Name that one line. **Never state a remaining quantity** — the API does not send one. No order was placed |
| `payment_gateway_unavailable` | 422 | **The order exists.** Show `details.order_number` prominently, write the local order record, clear the cart, and explain that payment could not be started and the merchant will be in touch. Do **not** offer a retry |
| `throttled` | 429 | Say the shop is busy and to try again shortly. Never retry automatically |
| transport failure | — | "We could not reach the store." The order may or may not exist; say so, and point at the order lookup |

`payment_gateway_unavailable` is the treatment most likely to be got wrong. There
is no retry-payment endpoint, so a "try again" button would place a **second**
order and decrement the same stock twice for goods the customer has already
reserved.

A transport failure after the request left the browser is genuinely ambiguous —
the order may exist. The copy must not claim the order failed, and it must point
at the lookup page.

### Confirmation

`/checkout/confirmation`, reached only from the cash-on-delivery path, with the
order number in the URL so the page survives a refresh:

```text
/checkout/confirmation?order=TL-2026-000142
```

It reads the rest from the local order record. It shows the order number at
display size and the confirmed `subtotal`, `shipping_fee` and `total` exactly as
the API returned them, and says a confirmation email is on its way to the address
given.

It keeps the order number prominent anyway. The backend's send cannot fail
loudly — `send_email` swallows every exception so an SMTP problem does not fail a
placed order — so "check your email" is a claim this page cannot verify. The
number plus the email address is the fallback, through `/orders/lookup`.

---

## Implemented

- **Compact layout (2026-09-24).**
  - Short fields share rows: three from `xl`, two from `sm`, one on a phone.
  - Contact is name, email and phone. Delivery is address across two columns
    with city beside it, then district, then the note across two columns.
  - Rows bottom-align so hinted fields line up with their neighbours.
  - Section legends are small uppercase labels rather than headings.
  - The note is two rows.
  - Gutters match the header's 50px.
  - The loading skeleton follows the same grid.

- `app/checkout/page.tsx` — server shell, `noindex`; the form is a client island
- `components/checkout/CheckoutForm.tsx` — the form, the submission and every
  error treatment in the table above. Input `name`s are the API's field names, so
  a 400's `details` maps straight onto the field. Native constraint validation
  (`required`, `maxLength`, `type="email"`) is the client-side courtesy; the only
  hand-written check is that a payment method was chosen
- `components/checkout/OrderSummary.tsx` — lines as `quantity × unit price`, the
  shipping note, no total
- `components/checkout/districts.ts` — the 77 districts as display names. The
  backend matches the valley three case-insensitively, so `"Lalitpur"` is sent
  as typed and stored readably on the order
- `app/checkout/confirmation/page.tsx` and `components/checkout/Confirmation.tsx`
  — the number from `?order=`, the three amounts and the email from the local
  record after hydration; with no record (another device, cleared storage) the
  number and a pointer to the lookup. The number is set at `text-title`, not
  `text-display`: at 12vw a fourteen-character number overflows a phone
- `lib/orders/record.ts` — `tl.orders.v1`, newest first, one entry per order
  number, capped at ten. Each entry holds the order number, the email as typed,
  this device's timestamp, the payment method, and `subtotal`, `shipping_fee`
  and `total` as the API returned them — or `amounts: null` after
  `payment_gateway_unavailable`, which names the order and nothing else
- `components/ui/Field.tsx` — see `design-system.md`; `RadioGroup` gained an
  `error` slot wired the same way
- The bag's Checkout button is now a link to `/checkout`

Verified against a stubbed API (unit and end to end). Not yet run against the
real backend: its `.env` allows only `https://example.com` for CORS, so a
browser on `localhost:3000` cannot reach checkout until that is cleared.

---

## Remaining

- **Live verification against the backend**, once its `.env` allows the
  storefront's origin: one cash-on-delivery order and one Khalti sandbox order.
- After `location.assign` to Khalti, the back button can restore this page from
  the bfcache with the button still reading "Placing your order…". The order
  exists by then, so a dead button is the safe failure; not handled.

Two things this feature cannot fix, recorded so they are raised rather than worked
around:

- **The customer cannot see the shipping fee before committing.** The fee is
  computed by the checkout endpoint and returned only with the placed order, so
  the figure the customer agrees to is one they see afterwards. The storefront
  mitigates it with a copy string and nothing more. The real fix is a backend
  endpoint that quotes a fee for a district, or the two band values published
  somewhere the storefront can read.
- **`NEXT_PUBLIC_SHIPPING_NOTE` duplicates backend configuration in prose.** If
  the merchant changes `SHIPPING_FEE_INSIDE_VALLEY` and not this string, the
  storefront states a fee it does not charge, and nothing detects it.

---

## Decisions

### Decision: `district` is a select, not a text input

**Decision**

A fixed list of Nepal's 77 districts as display names. The three valley districts
match the backend's list case-insensitively, which is how the backend compares.

**Reason**

The API takes `district` as free text and charges the outside-valley rate for
anything it does not recognise. A customer who types "Kathmandoo" is overcharged
by a hundred rupees, silently, with no error and no way to tell. The backend's own
documentation names a district dropdown in the storefront as the correct fix
rather than server-side fuzzy matching.

**Consequence**

The list lives in this repository and must stay in agreement with the backend's
`KATHMANDU_VALLEY_DISTRICTS` for the three that matter. A rename on either side
starts overcharging valley customers with nothing failing.

### Decision: no total is shown before the order is placed

**Decision**

The checkout summary shows line prices, a shipping note, and no total. The first
total the customer sees is the one the API returned.

**Reason**

[ADR 0003](../decisions/0003-money-is-a-decimal-string-end-to-end.md) forbids the
arithmetic, and the shipping fee is not knowable to the storefront in any case. A
computed total that turns out to differ from the charge is worse than no total.

**Consequence**

The customer commits without a total, which is a real product weakness and is the
reason the shipping note exists. It is also why this is listed under Remaining as
something the backend should close.

### Decision: the cart is cleared only on the cash-on-delivery path

**Decision**

Cash on delivery clears the cart before the confirmation page. Khalti leaves it
until the return lands successfully.

**Reason**

A customer who abandons Khalti's hosted page, or whose payment expires after sixty
minutes, comes back to a storefront where the order exists but they have no access
token and no email. Leaving the bag intact gives them something to act on.

**Consequence**

A customer who pays successfully and lands on `/orders/{accessToken}` has their
cart cleared there, by that feature, when the handoff marker this form wrote
matches the order. The marker exists because the confirmation email links to the
same route for every order, and opening it later must not empty a new bag. The
two halves of the clear live in different features, and neither may assume the
other ran.

### Decision: no retry on `payment_gateway_unavailable`

**Decision**

The failure page for a gateway error offers no way to try payment again.

**Reason**

There is no retry-payment endpoint. The only thing a retry button could do is call
checkout a second time, which places a second order and decrements the same stock
again.

**Consequence**

The customer is left with an order they cannot pay for online, and the merchant
resolves it out of band. This is the backend's documented behaviour, and the copy
has to make it navigable rather than alarming.

---

## Gotchas

- **`payment_gateway_unavailable` means the order was placed.** Treating it as a
  generic checkout failure loses the order number and invites a duplicate order.
- **`variant_unavailable` carries `variant_ids`, a list. `insufficient_stock`
  carries `variant_id`, a string.** The two details shapes differ and the singular
  one is the easy mistake.
- **`insufficient_stock` carries no available count**, deliberately. Never write
  "only N left" — there is no N, and inferring one from a stale cache would
  publish what the backend refuses to.
- **`payment_url` is absent for cash on delivery**, not null. Check for the key.
- **The checkout response never contains `access_token`.** Nothing in this feature
  can produce one, and a COD customer never gets one at all.
- **Nothing is validated against the API before submission.** A pre-flight
  availability check is a check-then-act race; the lock at placement is the only
  correct place to decide.
- **The form must never unmount on failure.** A customer who has typed an address
  and hit a 422 must not have to type it again.
- Duplicate cart lines for one variant are summed server-side before the stock
  decrement. `lib/cart` merges them already; if it ever stops, the customer is
  charged for a sum they did not see.
- `note` is optional and defaults to `""` server-side. Sending `null` is a 400.
- **Only failures that placed nothing keep the form.** Once an order exists —
  cash on delivery, or `payment_gateway_unavailable` — the form is replaced, so
  nothing invites a second order. The cart is cleared *after* that render
  (`flushSync`), or the empty-bag state flashes first.
- **A 400 about `items` rather than a field is not ambiguous.** Nothing was
  placed, and nothing the customer typed can fix it; it gets its own notice, not
  the "may or may not have been placed" copy.
- **Anything that is not an `ApiError` is uncertain**, including a 201 whose
  body could not be parsed. The order may exist, so no copy says it failed.
- **The 30-per-hour limit is per IP.** A customer behind carrier-grade NAT shares
  it with their neighbourhood, so a 429 here is not necessarily their fault and
  the copy should not imply it is.
- The order record must be written **before** the Khalti redirect. After
  `location =` assigns, this page is gone.

---

## Routes

```text
/checkout                  server shell, client content, dynamic, not indexed
/checkout/confirmation     server shell, client content, dynamic, not indexed
```

Neither is cached and neither is crawled.

---

## API

### Calls

```text
POST /api/v1/checkout/     browser, no-store
```

### Errors handled

See the table under Planned. The full code → treatment vocabulary is in
[architecture.md](../architecture.md#error-handling); the request and response
shapes are in [backend-api.md](../integrations/backend-api.md).

---

## State and data

| Tier | Holds |
| --- | --- |
| React state | Every form field, the submitting flag, the error state |
| `localStorage` | Reads `tl.cart.v1`; writes `tl.orders.v1`; clears the cart on the COD path |
| URL search params | `?order=` on the confirmation page, so a refresh survives |

**No access token is ever written to storage.** The local order record holds the
order number, the email as typed, the timestamp, the payment method, and the
subtotal, shipping fee and total as the API returned them (null after a gateway
failure).

---

## Accessibility

- Every field has a real `<label>`. A placeholder is not a label, and this is the
  longest form in the store.
- Field errors are associated with their inputs by `aria-describedby` and the
  input is marked `aria-invalid`, so a screen reader reads the problem with the
  field rather than as a detached banner.
- On a failed submission, focus moves to the first field in error, and an
  assertive live region announces how many fields need attention.
- The submit button is disabled while in flight and announces its busy state; the
  form is never replaced by a spinner.
- **District is a searchable combobox (2026-09-24)**, replacing the native
  `<select>`, whose 77-row list was too long to scroll.
  - It is the WAI-ARIA editable combobox: the input itself filters the list.
    Arrow keys move, Enter chooses, Escape closes, and the highlighted option
    is `aria-activedescendant`.
  - The value travels in a hidden `name="district"` input, so half-typed or
    misspelled text is never sent. That matters because a misspelled valley
    district would be charged the outside-valley fee with no error
    (`districts.ts`).
  - It keeps native validation: `required` for empty, and a custom validity
    message ("Choose a district from the list.") for unmatched text.
  - A district typed out in full, in any case, counts as chosen on blur.
  - The trade-off: a phone no longer gets the platform picker. Typing three
    letters is faster than scrolling 77 names.
- The order summary is associated with the submit action, so the lines and the
  shipping note are read before the button rather than after it.
- `payment_gateway_unavailable` renders the order number as text that can be
  selected and copied, not as an image or a styled fragment.

---

## Tests

- `components/checkout/CheckoutForm.test.tsx` (10): the COD 201 (body carries
  ids and quantities and no price; cart cleared; routed with the number); the
  Khalti 201 (`location.assign`, record written, cart intact); a 400 inline with
  focus and every value kept; `variant_unavailable` naming both lines and
  removing them; `insufficient_stock` with no digit in the notice;
  `payment_gateway_unavailable` (number shown, heading focused, cart cleared, no
  button at all, one request); `throttled` without retry; a transport failure
  with the uncertain copy and the lookup link; a missing payment method; an
  empty bag
- `lib/orders/record.test.ts` (8), `components/checkout/districts.test.ts` (2)
- `tests/e2e/buy-flow.spec.ts` — product → bag → checkout → confirmation on the
  cash-on-delivery path, with the checkout POST stubbed by `page.route`

---

## Files

```text
app/checkout/page.tsx
app/checkout/confirmation/page.tsx
components/checkout/CheckoutForm.tsx
components/checkout/OrderSummary.tsx
components/checkout/Confirmation.tsx
components/checkout/districts.ts        the fixed list
components/ui/Field.tsx
lib/api/orders.ts                       submitCheckout (built with api-client)
lib/orders/record.ts                    the local order record
```

---

## Future context

This feature's difficulty is not the form. It is that five distinct failures reach
one submit button, two of them leave a real order behind, and one of those two
looks like a failure. Get those two right and the rest is a form.

The shipping-fee gap is the clearest thing to raise with the backend: a customer
committing to an order without seeing the delivery charge is a conversion problem
and a fairness problem, and it is one endpoint away from being solved.

The backend shipped confirmation email on 2026-09-23 and ADR 0006 is superseded,
so the copy here reflects an email that is sent. The one thing not to lose in that
change: the send is best-effort and silent on failure, which is why the order
number stays prominent rather than being replaced by "check your email".
