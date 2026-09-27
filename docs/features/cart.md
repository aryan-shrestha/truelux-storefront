# Cart

Status: Implemented

Last updated: 2026-09-27

---

## Goal

Keep a bag in the browser, because the API has no cart (ADR 0002), and let the
customer review and edit it on its own page or in a sheet from the header.

---

## Scope

What is included in this implementation?

- `lib/cart`: the stored shape, the parser, the reducer and the React binding
- `/cart`: lines with a quantity stepper and remove, the quoted subtotal and
  free-shipping line, the shipping copy and the way to checkout
- The bag sheet opened from the header (see [site-shell.md](site-shell.md))

What is explicitly outside the scope?

- A server-side or synced cart, and any figure the storefront computes (ADR 0003).
  The subtotal is the API's quote ([checkout-quote.md](checkout-quote.md)).

---

## Context

A line stores what checkout needs (`variantId`, `quantity`) and enough display data
to render without a request, knowingly stale; the backend re-resolves every price
and stock level at placement.

---

## Implemented

- `lib/cart/storage.ts` — `CartLine` is `{ variantId, quantity, productSlug,
  productName, size, shade: string | null, unitPrice, imageUrl }` under
  `tl.cart.v2`. `parseCart` validates line by line, keeps valid lines, coerces
  missing display fields, and returns `[]` on any failure. `readCart` and `writeCart`
  survive a throwing `localStorage`; a write fires `tl:cart-changed` for the same
  tab.
- `lib/cart/reducer.ts` — `hydrate`, `add` (merging by variant id), `setQuantity`
  (below one removes), `remove`, `clear`; at most 20 lines and 10 units a line.
- `lib/cart/use-cart.tsx` — `CartProvider` and `useCart` over
  `useSyncExternalStore`, with an empty server snapshot and a `ready` flag.
- `components/cart/CartContents.tsx` — the `/cart` page: a skeleton until storage is
  read, the `EmptyBag` state, the lines, and a `Card` with `BagSummary` and a
  Checkout button that shows a spinner while the route loads. The shipping copy is
  a prop from `app/cart/page.tsx`.
- `components/cart/CartDrawer.tsx` — the same states in the header's `Sheet`, with
  `BagSummary`, Checkout and "View bag" pinned below the lines; any link closes the
  sheet.
- `components/cart/BagSummary.tsx`, `FreeShippingLine.tsx`, `use-quote.ts` — the
  debounced quote and its subtotal, free-shipping line and fallbacks
  ([checkout-quote.md](checkout-quote.md)).
- `components/cart/CartLine.tsx` — image, name, unit price, "Size · Shade" (size
  alone when shadeless), a quote problem when there is one, the stepper and Remove.
- `components/cart/QuantityStepper.tsx` — a shadcn `ButtonGroup` of two icon
  `Button`s and a number `Input`, each named for the product.
- `components/cart/EmptyBag.tsx`, `components/cart/CartLinesSkeleton.tsx`.
- `app/cart/page.tsx` — `noindex`.

---

## Remaining

None.

---

## Decisions

### Decision: the subtotal is the API's quote, and the bag shows no total

**Decision**

Lines show their stored unit price; the summary shows the quoted subtotal and the
free-shipping line, never a total.

**Reason**

ADR 0003 forbids money arithmetic, and the shipping fee depends on the district,
which the bag does not know.

**Consequence**

The first total is checkout's quote. Until a quote arrives the subtotal is a
skeleton; if it fails the bag shows no figures and "Shipping calculated at
checkout".

### Decision: lines merge by variant id

**Decision**

Adding a variant already in the bag raises its quantity.

**Reason**

The checkout endpoint sums duplicates before decrementing stock; two rows shown and
one charged would be wrong.

**Consequence**

A shade and a size together identify one line, because together they identify one
variant.

### Decision: `localStorage` is the store, and React subscribes to it

**Decision**

`useSyncExternalStore` over storage, not a `useState` mirror.

**Reason**

Two copies drift, and state written from effects cascades renders.

**Consequence**

Another tab's change arrives through the `storage` event.

---

## Gotchas

- **The storage key is `tl.cart.v2`.** v1 lines had a colour; bumping the key drops
  them instead of migrating.
- **Typing a zero must not delete the line**; the stepper ignores values below one
  and Remove deletes.
- **The bag's only API call is the quote** (its own `quote` throttle scope,
  600/hour). A sold-out variant can still be added; the quote marks it.
- **`localStorage` can throw on read**, not only return null.
- **The cart renders empty on the server**, and the page shows a skeleton rather
  than "empty" until storage is read.
- Never store the access token here.

---

## Routes

```text
/cart     static shell, client contents; noindex
```

---

## API

```text
POST /api/v1/checkout/quote/   browser, no-store, debounced (checkout-quote.md)
GET  /api/v1/shipping/         server, revalidate 3600, for the copy
```

---

## State and data

- `localStorage` `tl.cart.v2` — `{ version: 2, lines: CartLine[] }`.

---

## Accessibility

- The stepper's buttons and field are named for the product ("Increase quantity of
  Silk Foundation").
- Remove carries the product name in `sr-only` text.
- The header's bag link announces its count politely.

---

## Tests

- `lib/cart/storage.test.ts` — parsing, coercion, shadeless lines, a throwing
  `localStorage`, the v2 key.
- `lib/cart/reducer.test.ts` — merging, caps, quantity rules.
- `components/cart/CartContents.test.tsx` — lines, empty state, "Size · Shade", the
  stepper, Remove, typed quantities, and the quote cases listed in
  checkout-quote.md.
- `components/layout/CartButton.test.tsx` — the sheet.

---

## Files

```text
app/cart/page.tsx
components/cart/
lib/cart/
```
