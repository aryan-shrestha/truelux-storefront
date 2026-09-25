# Cart

Status: Implemented

Last updated: 2026-09-24

---

## Goal

Hold what a customer has chosen, on their device, and hand it to checkout as a
list of variant ids and quantities.

---

## Scope

What is included in this implementation?

- `lib/cart/reducer.ts` — add, remove, set quantity, clear, and line merging
- `lib/cart/storage.ts` — the versioned, validating parser and the writer
- `lib/cart/use-cart.ts` — the context and hook
- `/cart` — the cart page
- The cart drawer, opened from the header
- The empty state

What is explicitly outside the scope?

- Anything that submits the cart, which belongs to `checkout.md`
- Any API call. This feature makes none
- A total, a subtotal, or any arithmetic on money
- Server-side cart persistence, cross-device sync, or abandoned-cart recovery —
  the API has no cart

---

## Context

[ADR 0002](../decisions/0002-the-cart-is-browser-state.md) is the governing
decision and should be read before changing anything here. Its two central rules:

- The cart stores **display data knowingly**, captured when a line was added, so
  the cart page renders with no network call. That data is stale by design.
- **The storefront performs no money arithmetic.** The cart page shows line prices
  and no total, because the total depends on a shipping band derived from a
  district the customer has not yet entered, and because
  [ADR 0003](../decisions/0003-money-is-a-decimal-string-end-to-end.md) keeps
  amounts as strings.

The backend has no cart table and no cart endpoint. It sees the cart exactly once,
as the `items` array of a checkout request, and it re-resolves every price and
every stock level inside a row lock at that moment.

One behaviour of the checkout endpoint shapes the reducer: **duplicate lines for
one variant are summed server-side before the stock decrement.** The cart should
merge them anyway, so that what the customer sees and what is charged agree.

---

## Planned

### Shape

```ts
type CartLine = {
  variantId: string;   // the only field checkout needs
  quantity: number;    // >= 1
  productSlug: string; // to link back
  productName: string; // display
  size: string;        // display
  color: string;       // display
  unitPrice: Money;    // display, captured at add time
  imageUrl: string | null;
};

type Cart = { version: 1; lines: CartLine[] };
```

Everything after `quantity` is display data and is understood to be stale.

### Reducer

Pure, synchronous, no React:

| Action | Behaviour |
| --- | --- |
| `add` | Appends, or **merges into an existing line with the same `variantId`** by summing quantities |
| `setQuantity` | Clamps to at least 1; setting 0 removes the line |
| `remove` | By `variantId` |
| `clear` | After a successful checkout |

Merging by `variantId` is what keeps the cart honest: two lines for one variant
would display as two rows and be charged as one summed line.

A maximum of **20 lines and 10 units per line** is enforced here. The API enforces
no cart size at all — its own documentation notes this as a deliberate gap — so a
sane bound belongs on this side.

### Storage

```text
key: tl.cart.v1
```

- Read is wrapped in `try`/`catch`. A throw — private-mode Safari, blocked site
  data, an embedded webview — yields an empty cart rather than a crashed page.
- The parsed value is **validated**, not cast: an array, each line an object with a
  string `variantId` and a positive integer `quantity`, display fields coerced to
  strings. Anything that fails resets to empty.
- Writes are debounced, so a quantity stepper held down writes once.
- **The version suffix is bumped rather than migrated.** A customer losing a cart
  across a schema change costs less than migration code nobody can test.

### The page and the drawer

Both render the same line list. The drawer is for confirming an add and getting to
checkout; the page is for editing.

```text
┌──────────────────────────────────────────┐
│  ▢   Oversized Tee                       │
│      Black · M          Rs 2,400   [– 1 +]│
│                                     Remove│
├──────────────────────────────────────────┤
│  ▢   Cargo Pant                          │
│      Bone · 32          Rs 4,200   [– 2 +]│
│                                     Remove│
├──────────────────────────────────────────┤
│  Shipping and total are confirmed at      │
│  checkout.                                │
│                            [ Checkout ]   │
└──────────────────────────────────────────┘
```

**No total.** The line that explains why is part of the design, not a placeholder:
shipping depends on the district, and the confirmed figures come back from the
checkout response.

The empty state is an invitation, not a message — it links to the listing.

### Hydration

The cart cannot exist during server rendering. Every surface that reads it renders
a stable placeholder first and fills in after hydration:

- the header count renders an empty fixed-width slot
- the cart page renders a skeleton of the line list, not the empty state, because
  showing "your bag is empty" to someone with a full bag is worse than showing
  nothing for a moment

---

## Implemented

- **The bag opens as a sheet from the right** (2026-09-24).
  - `CartButton` is still a link to `/cart`. A plain click opens `Sheet` with
    `CartDrawer` instead of navigating.
  - Without JavaScript, or with a modifier key or middle button, the link
    navigates as it always did, so `/cart` stays a real page.
  - `CartDrawer` has the same three states as the page (not read yet, empty,
    lines) in a 440px column. The lines scroll on their own (`scroll-quiet`).
    Checkout, the shipping note and "View bag" are pinned below them.
  - There is no total, for the same reasons as the page.
  - Any link inside closes the sheet as it navigates.
  - The title carries the count: "Your bag (2)".
  - `Sheet` is Radix Dialog without a trigger. The opener must stay a link,
    so focus is returned to it by hand in `onCloseAutoFocus`.
  - It slides in over 500ms and out over 300ms. Under reduced motion it
    appears and leaves at once.
  - Tested in `CartButton.test.tsx`:
    - a plain click opens it
    - a modified click does not
    - Escape closes it and returns focus to the link
  - The e2e flow now goes through the sheet to "View bag" and to "Checkout".

- `lib/cart/storage.ts` — the versioned key, `parseCart`, `readCart`,
  `writeCart`, `countLines` and the `tl:cart-changed` event. Built early with
  `site-shell` (#3), because the header shows a count and has to read the cart
- `lib/cart/reducer.ts` — `hydrate`, `add`, `setQuantity`, `remove`, `clear`,
  with merging by variant id and both caps
- `lib/cart/use-cart.tsx` — `CartProvider` and `useCart`, over
  `useSyncExternalStore`. See the decision below
- `components/cart/CartContents.tsx` — the skeleton, the empty state, the line
  list and the summary panel
- `components/cart/CartLine.tsx`, `components/ui/Quantity.tsx`
- `app/cart/page.tsx` — `noindex`, because the cart is this device's state
- `lib/cart/storage.test.ts` (10), `lib/cart/reducer.test.ts` (17),
  `CartContents.test.tsx` (6), and the bag legs of `tests/e2e/buy-flow.spec.ts`

---

## Remaining

- **There is no cart drawer.** `Scope` listed one, and it is deliberately not
  built. Adding to the bag is confirmed inline on the product page and does not
  open anything, so the drawer's only job would be a quick look from the header —
  which `/cart` already does, with a URL, without JavaScript, and without a
  second rendering of the same line list. Build it when there is a reason beyond
  symmetry with other shops.
- **The checkout button is disabled**, because `/checkout` does not exist until
  `checkout` (#7). It says so rather than linking to a page that would 404.

---
## Decisions

### Decision: the cart page shows no total

**Decision**

Line prices only, with one line of copy saying the total is confirmed at checkout.

**Reason**

Two independent reasons, either sufficient. The shipping fee depends on a district
collected on the next screen, so a total here would be incomplete; and
[ADR 0003](../decisions/0003-money-is-a-decimal-string-end-to-end.md) forbids the
arithmetic that would produce it.

**Consequence**

Unusual enough to need explaining in the interface, and the first thing someone
will try to add. Both reasons must be removed before it can appear.

### Decision: lines merge by variant id

**Decision**

Adding a variant already in the cart increases its quantity rather than appending
a second line.

**Reason**

The checkout endpoint sums duplicate lines before decrementing stock, so two rows
would be charged as one. A cart that displays two and charges one is wrong even
though the money is right.

**Consequence**

"Add to bag" on a product already in the cart silently changes a number elsewhere
on the page. The confirmation has to say the quantity, not just that something was
added.

### Decision: localStorage is the store, and React subscribes to it

**Decision**

`useSyncExternalStore` over `localStorage`, rather than `useState` mirroring it
and effects keeping the two in step.

**Reason**

Two copies of a cart drift, and the synchronising effect has to write state
during render-commit — which React now flags as the cascading-render pattern it
warns about, and which is how this was found. The external-store hook is the
primitive for exactly this case, and its server snapshot makes hydration honest
instead of something to remember.

**Consequence**

`getSnapshot` must return a stable reference for unchanged data or React
re-renders forever, so the raw string is cached and compared before parsing.
Every mutation reads the store, applies the reducer and writes back; there is no
second copy to keep in step.

### Decision: a cart size limit lives here

**Decision**

Twenty lines, ten units per line.

**Reason**

The API enforces no maximum, and a checkout request with thousands of lines holds
row locks across the whole cart inside one transaction. The backend's own
documentation names this as the first thing to add if the endpoint is abused. A
bound on this side costs nothing and is a reasonable shopping experience.

**Consequence**

The numbers are invented rather than measured, and a customer buying for a group
could genuinely hit them. They are a product decision and should be revisited with
the merchant rather than treated as technical.

---

## Gotchas

- **Typing a zero into the quantity field must not delete the line.** Setting
  zero is how the reducer removes one, which is right for a stepper and wrong
  for a text input: selecting the field to type "10" would remove the line on
  the first keystroke. `Quantity` forwards only values at or above its `min`,
  and Remove is the way to delete.
- **Nothing here calls the API.** Adding a sold-out variant is allowed, and
  checkout is where it is discovered. Adding a validation call would be a
  check-then-act race.
- **`localStorage` can throw on read, not only return null.** Private-mode Safari
  and blocked site data both throw, and an unwrapped read takes down the header on
  every page.
- **Never store the access token here.** The cart's key is not a place for a
  credential, and
  [ADR 0006](../decisions/0006-the-storefront-keeps-its-own-order-record.md) keeps
  the order record separate and tokenless for the same reason.
- **The cart renders empty on the server.** A component that renders a count or a
  line list during SSR produces a hydration mismatch, and React discards the
  server's markup for that subtree.
- **The cart page must not flash "empty" before hydration.** Skeleton first, empty
  state only once storage has actually been read.
- Prices in the cart are captured at add time and can be stale by hours. This is
  the decision, not a bug, and the copy about confirmation at checkout is what
  makes it honest.
- A product renamed in the catalogue keeps its old name in an existing cart line.
- `quantity` is an integer with a minimum of 1. A `0` reaching checkout is a 400,
  and a negative would be a 500 on the backend if its serializer did not bound it.
- Debounced writes mean the last change can be up to the debounce interval behind.
  Flush on `visibilitychange`, or a customer who closes the tab immediately after a
  change loses it.

---

## Routes

```text
/cart     client-rendered content inside a server shell, not indexed
```

The route renders nothing cacheable — its content is `localStorage`.

---

## API

```text
None. This feature makes no request.
```

---

## State and data

| Tier | Holds |
| --- | --- |
| `localStorage` | `tl.cart.v1` — the full cart, versioned and validated on read |
| React state | The drawer's open/closed state |
| URL search params | None |

Parsing failure resets to an empty cart. There is no migration path between
versions; the key is bumped.

---

## Accessibility

- The quantity stepper is a labelled number input with increment and decrement
  buttons, each with an accessible name that includes the product — "Increase
  quantity of Oversized Tee" — because a page of unlabelled plus buttons is
  unusable.
- Touch targets on the stepper and remove control are at least 44px.
- Removing a line announces what was removed through a polite live region, and
  focus moves to the next line rather than being lost to `<body>`.
- The drawer is a `Dialog`: focus trapped, restored on close, Escape dismisses.
- The count in the header is part of the cart button's accessible name.
- The "total confirmed at checkout" line is associated with the checkout button,
  not floating as decoration, so it is read before the action rather than after.

---

## Tests

- `lib/cart/reducer.test.ts` — adding the same variant twice merges and sums;
  setting quantity to 0 removes; the line and unit caps hold; clear empties
- `lib/cart/storage.test.ts` — absent key, malformed JSON, a v0 shape, a line
  missing `variantId`, a negative quantity, and a `localStorage` that throws on
  read. Every one yields an empty cart and no exception
- `components/cart/CartLine.test.tsx` — the stepper's bounds and its accessible
  names
- `app/cart` — that the page renders a skeleton before hydration and the empty
  state only after

---

## Files

```text
lib/cart/reducer.ts
lib/cart/storage.ts
lib/cart/use-cart.ts
components/cart/CartDrawer.tsx
components/cart/CartLine.tsx
app/cart/page.tsx
```

---

## Future context

The reducer and the storage parser are pure functions with real edge cases and no
network, which makes them the cheapest valuable tests in the repository. The
storage parser in particular is the thing standing between a hand-edited
`localStorage` value and a crashed header on every page.

When the backend adds a cart table — its own documentation expects this to arrive
with abandoned-cart email — this feature becomes a client of it and the staleness
problem disappears. The no-arithmetic rule should survive that change: it is about
which system has authority over money, not about where the cart is stored.
