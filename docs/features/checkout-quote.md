# Checkout quote and free shipping

Status: Implemented

Last updated: 2026-09-27

---

## Goal

Show the customer their subtotal, shipping and total in the bag and at checkout
before they place the order. Nudge them toward the merchant's free-shipping
threshold. All the figures come from the API; the storefront still does no money
arithmetic.

---

## Scope

What is included in this implementation?

- `lib/api`:
  - `quoteCart({ items, district? }, { signal })`, calling
    `POST /api/v1/checkout/quote/` from the browser with `cache: "no-store"`
    (ADR 0001).
  - `getShipping()`, calling `GET /api/v1/shipping/` server-side with
    `revalidate: 3600`.
- **Bag** (drawer and `/cart`): the quoted subtotal; "Add Rs X more for free
  shipping", "Free shipping" or "Shipping calculated at checkout"; the store's
  shipping copy beneath. Re-quoted, debounced, whenever the lines change.
- **Checkout summary:** subtotal, shipping and total from a quote that includes the
  selected district, re-quoted when the district or the lines change, with the same
  free-shipping line. **Place order** stays enabled while a quote is in flight.
- **Quote errors** (`variant_unavailable`, `insufficient_stock`) are shown against
  the affected line.
- **`NEXT_PUBLIC_SHIPPING_NOTE` is removed.** The announcement bar, the product
  page's Delivery row and the bag's shipping copy come from `getShipping()`.

What is explicitly outside the scope?

- Discount codes (Phase 2, Increment 3). The checkout summary renders a `discount`
  row only when it is not zero.
- A client-side estimate before the first quote returns. A `skeleton` is shown,
  never a computed number.

---

## Context

Backend contract: `../back-end/docs/features/checkout-quote-and-shipping.md`
(implemented by the backend on 2026-09-27), transcribed in [backend-api.md](../integrations/backend-api.md#post-apiv1checkoutquote).
Money is a string end to end, and only `lib/format/money.ts` formats or inspects it.
Every component is shadcn (ADR 0009); the storefront is light only (ADR 0012).

---

## Implemented

- `lib/api/client.ts` — `request` accepts an `AbortSignal`.
- `lib/api/orders.ts` — `quoteCart` sends `items` and, only when set, `district`;
  returns `subtotal`, `shippingFee`, `discount`, `total` and
  `freeShippingRemaining`. The wire's `lines` are not mapped: nothing shows them.
  `RawQuote` is exported for fixtures.
- `lib/api/catalog.ts` — `getShipping`, `SHIPPING_REVALIDATE = 3600`.
- `lib/api/types.ts` — `QuoteInput`, `CartQuote` (`shippingFee` and `total`
  nullable), `ShippingSettings` (`freeShippingThreshold` nullable).
- `lib/format/money.ts` — `isZeroAmount`, for choosing copy ("Free", hiding a nil
  discount); it computes nothing.
- `lib/shipping/note.ts` — `describeShipping(settings)`: "Free shipping over
  Rs 8,000 · Cash on delivery" with a threshold, "Rs 150 inside the Kathmandu
  valley, Rs 250 elsewhere · Cash on delivery" without, "Cash on delivery" when the
  read failed. `shippingNote()` reads and degrades, like the navigation reads.
- `components/cart/use-quote.ts` — `useQuote(lines, district)`: waits 300 ms of
  stillness, aborts the previous request with an `AbortController`, and returns a
  settled state only while its `lines` reference and `district` are still current;
  otherwise `pending`. States: `pending`, `ready`, `problems` (variant id → 
  `unavailable` | `insufficient`), `failed`. Also `LINE_PROBLEM_COPY`.
- `components/cart/FreeShippingLine.tsx` — `freeShippingRemaining` set → the nudge;
  `shippingFee` zero → "Free shipping"; otherwise the optional fallback.
- `components/cart/BagSummary.tsx` — subtotal (a `Skeleton` while pending), the
  free-shipping line, and the shipping copy, in a polite live region.
- `components/cart/CartLine.tsx` — an optional `problem` line in destructive text.
- `components/cart/CartContents.tsx`, `CartDrawer.tsx` — quote without a district;
  take `shippingNote` from the server (`app/cart/page.tsx`; `Header` →
  `CartButton`).
- `components/checkout/OrderSummary.tsx` — Subtotal, Discount (when non-zero),
  Shipping (fee, "Free", or "Choose a district" before one is chosen), Total (or
  "After shipping"), the free-shipping line; skeletons while pending; the marked
  lines and "Remove or change the marked items to see your total" on a line
  problem; "The total, including shipping, is confirmed when your order is placed"
  on any other failure.
- `components/checkout/DistrictPicker.tsx` — now controlled (`value`, `onChange`);
  `CheckoutForm` owns the district and passes it to `useQuote`.
- `components/layout/AnnouncementBar.tsx` — the bar, from `shippingNote()`.
- `components/catalog/ProductCare.tsx` — the Delivery row from `shippingNote()`.
- `lib/env.ts`, `.env.example`, `README.md`, `../DEPLOY.md`, `vitest.config.mts` —
  `NEXT_PUBLIC_SHIPPING_NOTE` removed (and from the local `.env.local`).

---

## Remaining

- **Verify against the live backend.** On 2026-09-27 the local backend served
  `/shipping/` but its dev database had no `shipping_settings` table yet (500), so
  the bar showed the degraded "Cash on delivery"; the quote was only ever stubbed.

---

## Decisions

### Decision: the quote is an effect, debounced and abortable

**Decision**

`useQuote` runs in an effect keyed on the cart's `lines` reference and the
district.

**Reason**

The quote must follow the bag wherever it changes — the stepper, another tab, a
removal from a checkout notice — and the lines come from `useSyncExternalStore`, so
there is no single event handler to put it in. The repository's "no `useEffect` to
fetch" rule is about the catalogue, which the server caches; this is a
customer-scoped browser call (ADR 0001).

**Consequence**

The stored cart's snapshot reference is stable while storage is unchanged, so an
unchanged bag never re-quotes. A stale answer is dropped twice over: its request is
aborted, and its result is keyed to the lines it priced.

### Decision: "Free shipping" is read from a zero fee, not from the settings

**Decision**

The free-shipping line uses only the quote: `free_shipping_remaining`, then a
`shipping_fee` of zero.

**Reason**

The contract makes a districtless `shipping_fee` non-null only when the threshold
is reached, and a zero fee with a district is free shipping either way. The
settings are cached for an hour and may disagree with a live quote.

**Consequence**

The bag needs no shipping settings to choose its line; they only feed the copy
beneath it.

### Decision: a failed quote shows no figures and never blocks the order

**Decision**

`throttled` (the `quote` scope, 600/hour, so rare), a transport failure or any
other code shows no figures: "Shipping calculated at checkout" in the bag, "The
total, including shipping, is confirmed when your order is placed" at checkout.
Nothing retries, and Place order is never held back.

**Reason**

A quote is advisory and the order response is authoritative. Keeping the last good
figures would show a subtotal for lines that have since changed, and a skeleton
left in place reads as loading forever.

**Consequence**

A failed quote costs the customer the preview, never the order. The quote has its
own throttle scope, so it cannot spend the 30/hour checkout budget.

---

## Gotchas

- **The quote has its own `quote` throttle scope, 600/hour per IP**, separate from
  checkout's 30/hour. Each settled edit of the bag, each drawer opening and each
  district change costs one.
- **An empty `district` (`""` or `null`) is the same as omitting it**; `quoteCart`
  omits it.
- **`/shipping/` sends no `Cache-Control`**; `revalidate: 3600` is its only
  caching.
- **A districtless quote has `shipping_fee` and `total` null** unless the threshold
  is reached. They are `Money | null` in `CartQuote`.
- **`page.route` cannot stub `/shipping/`**: it is read by Server Components in the
  Next process. It is covered by unit tests only.
- The quote summary is not an `Alert` and has no `role="status"`: the checkout's
  own status line and failure alerts are asserted by role in its tests.
- "Choose a district" appears twice at checkout before one is chosen: the picker's
  placeholder and the Shipping row.

---

## Routes

```text
/cart        now reads getShipping() on the server (revalidate 3600)
/checkout    unchanged shell; the quote is browser-side
```

---

## API

### Calls

```text
POST /api/v1/checkout/quote/   browser, no-store, debounced 300 ms, aborted when stale
GET  /api/v1/shipping/         server, revalidate 3600 (shippingNote, degrades)
```

### Errors handled

| `code` | Treatment |
| --- | --- |
| `variant_unavailable` | Each id in `details.variant_ids` marks its line "This is no longer available."; no figures |
| `insufficient_stock` | `details.variant_id` marks its line "There is not enough stock for this quantity."; no quantity, no figures |
| `throttled`, `validation_error`, anything else, no response | No figures; "Shipping calculated at checkout" (bag) or "confirmed when your order is placed" (checkout); no retry |

---

## State and data

- React state — the settled quote (with the lines and district it priced) and the
  chosen district.
- No new storage.

---

## Accessibility

- The bag's subtotal and the checkout totals sit in `aria-live="polite"` regions,
  so a change after a quantity step is announced.
- Skeletons are inside `aria-busy` containers beside visible labels.
- Line problems are text, not colour alone.

---

## Tests

- `lib/api/orders.test.ts` — the body, `no-store`, an omitted district, null
  shipping and total, and the `variant_unavailable`, `insufficient_stock` and
  `throttled` codes.
- `lib/api/catalog.test.ts` — `getShipping` mapping, a null threshold, revalidate.
- `lib/api/client.test.ts` — the abort signal is passed through.
- `lib/format/money.test.ts` — `isZeroAmount`.
- `lib/shipping/note.test.ts` — threshold, no threshold, and a failed read.
- `components/cart/CartContents.test.tsx` — skeleton and no figure before the
  quote; the three free-shipping states; a debounced re-quote; a stale answer
  ignored; each line problem on the right line; a throttled quote shows no
  figures.
- `components/checkout/CheckoutForm.test.tsx` — re-quote with the district and the
  API's total; Place order enabled while a quote is in flight; a line marked by the
  quote; the existing placement cases, counting checkout calls apart from quotes.
- `tests/e2e/buy-flow.spec.ts` — every quote stubbed; a quote crossing the
  threshold changes the message; checkout shows the quoted total.

---

## Files

```text
lib/api/{client,orders,catalog,types}.ts
lib/format/money.ts
lib/shipping/note.ts
components/cart/{use-quote.ts,BagSummary.tsx,FreeShippingLine.tsx,CartLine.tsx,CartContents.tsx,CartDrawer.tsx}
components/checkout/{OrderSummary,DistrictPicker,CheckoutForm}.tsx
components/layout/{AnnouncementBar,Header,CartButton}.tsx
components/catalog/ProductCare.tsx
tests/fixtures/quote.ts
```
