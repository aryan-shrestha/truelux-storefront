# Checkout quote and free shipping

Status: Planned

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
  - `quoteCart(items, district?)`, calling `POST /api/v1/checkout/quote/`. It runs in
    the browser with `cache: "no-store"`, because a quote is customer-scoped
    (ADR 0001).
  - `getShipping()`, calling `GET /api/v1/shipping/` server-side with an explicit
    `revalidate`.
- **Bag** (drawer and `/cart`):
  - shows the quoted subtotal;
  - "Add Rs X more for free shipping" when `free_shipping_remaining` is set;
  - "Free shipping" once the threshold is reached;
  - otherwise "Shipping calculated at checkout".
  - It re-quotes, debounced, whenever the lines change.
- **Checkout summary:** subtotal, shipping and total from a quote that includes the
  selected district, re-quoted when the district or the lines change, with the same
  free-shipping line. The **Place order** button stays enabled while a quote is in
  flight, because the order response is authoritative.
- **Quote errors** (`variant_unavailable`, `insufficient_stock`) are shown against the
  affected line, using the same copy and code-branching as checkout (ADR 0005).
- **`NEXT_PUBLIC_SHIPPING_NOTE` is removed.** The announcement bar, the product page's
  Delivery row and the bag copy are built from `getShipping()`, e.g. "Free shipping
  over Rs 8,000 · Cash on delivery", or the two fees when there is no threshold.
  Update `lib/env.ts`, `.env.example`, the README and `DEPLOY.md`.
- **Request budget:** add `/shipping/` to the arithmetic in `docs/architecture.md`.
  The quote is browser traffic, per customer IP, so it is outside the server budget.

What is explicitly outside the scope?

- Discount codes (Phase 2, Increment 3). The UI renders a `discount` line only when it
  is not `"0.00"`.
- A client-side estimate before the first quote returns. Show a `skeleton`, never a
  computed number.

---

## Context

Backend contract: `../back-end/docs/features/checkout-quote-and-shipping.md`.
Money is a string end to end, and only `lib/format/money.ts` formats it.
Every component is shadcn (ADR 0009); the storefront is light only (ADR 0012).

---

## Tests

To be written:

- `quoteCart` and `getShipping` envelope parsing, and their error codes.
- The bag shows each of the three free-shipping states from stubbed quotes.
- Checkout re-quotes when the district changes, and shows the quoted total.
- A quote error marks the right line.
- The announcement copy for both "threshold set" and "no threshold".
- Playwright: a stubbed quote crossing the threshold changes the message.
