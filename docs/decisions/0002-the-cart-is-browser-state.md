# ADR 0002: The cart is browser state, and the server is the only authority on price and stock

Status: Accepted

Date: 2026-09-21

Supersedes: None

---

## Context

The backend has no cart. There is no cart table, no cart endpoint, and no
server-side notion of a shopper who has not yet checked out. The API sees a cart
exactly once, as the `items` array of a checkout request.

That is not an omission the storefront can route around. It is a decision the
backend took deliberately, and it makes the cart entirely this repository's
problem: where it lives, how it survives a page load, and what it displays.

The displaying is the hard part. A cart line has to show a product name, a size, a
colour, a price and an image, and the only place to get them is the catalogue —
which the storefront reads through a cache that is minutes stale, and which the
backend re-resolves from scratch at checkout inside a row lock. Three versions of
the same price can exist at once: the one cached when the page rendered, the one
stored when the item was added, and the one the backend charges.

Meanwhile the price can change under the customer, a variant can sell out, and a
product can be unpublished, all while the cart sits in a tab overnight.

## Decision

**The cart lives in `localStorage`, under a versioned key, and holds display data
knowingly.**

A cart line stores what checkout requires plus what the cart page needs to render
without a network call:

```text
variantId        the only field the API accepts
quantity
productSlug      to link back
productName      display
size, color      display
unitPrice        display, captured at add time
imageUrl         display
```

**The storefront performs no money arithmetic.** It does not sum a cart, compute a
subtotal, add a shipping fee, or produce a total. The cart page shows line prices
and states that the total is confirmed at checkout. The checkout response's
`subtotal`, `shipping_fee` and `total` are the only totals ever displayed.

**Every stored price and every stored availability is a display value, not a
claim.** The backend re-resolves both at placement, and where the two disagree the
backend's answer is shown and the storefront's is discarded.

The cart is read through a parser that validates and resets to empty on any
failure, and its key carries a schema version.

## Reason

Storing the display fields is the choice that is easy to get wrong in the appealing
direction. The alternative — store only variant ids and quantities, then re-fetch
the products to render the cart — produces a cart page that is correct, slower, and
occasionally *empty*, because it needs one catalogue request per distinct product
and those requests are on a per-IP budget that ADR 0001 has already spent on
rendering the catalogue. A cart that cannot render because the shop is busy is a
worse failure than a cart showing yesterday's price.

Refusing to do arithmetic is the other half. The storefront could add up line
prices, and it would be right almost always. The times it would be wrong are the
times that matter: after a price change, when a variant override applies, and when
the shipping band is decided from a district the customer has not typed yet. A
total that is usually right teaches the customer to trust it and then charges them
something else. Not showing one is honest and costs nothing, because the customer
sees the real figure one screen later.

`localStorage` over a cookie or `sessionStorage`: a cookie would be sent on every
request to the backend for no reason and is capped at 4KB, which a six-line cart
with image URLs can approach. `sessionStorage` loses the cart when the tab closes,
and an Instagram in-app browser closes tabs constantly.

Versioning the key rather than migrating it is the same trade the backend makes
with its cache prefixes. A customer losing a cart across a deploy that changed the
schema is a smaller cost than migration code that nobody tests and that runs on
data nobody can reproduce.

## Alternatives considered

### Store only variant ids and quantities, and re-fetch to render

Why it was not chosen: it is the correct-by-construction option, and it means the
cart page can never show a stale price. It costs one catalogue request per product
on a budget ADR 0001 has already allocated, it makes the cart page fail when the
backend is rate-limiting, and it makes an offline or slow-network cart render as
nothing. It also does not remove staleness — it moves it from "the price when you
added it" to "the price a moment ago", and only one of those is explicable to a
customer.

### Compute and display a cart total client-side

Why it was not chosen: it is what every store does and what every customer expects.
It was rejected because this particular API makes the total genuinely unknowable
before checkout: the shipping fee depends on a district collected on the *next*
screen, and variant price overrides mean a line's price is not derivable from the
product. A displayed total that changes at checkout is worse than no total at all,
and the honest alternative — "total confirmed at checkout" — is one line of copy.

### Ask the backend for a cart table

Why it was not chosen: it is the right long-term answer and the backend's own docs
say so, naming abandoned-cart email as the feature that will force it. It is a
Phase 2 change to another repository, and blocking the storefront on it would stop
the project for a feature nobody has asked for.

### Validate the cart against the API before showing the checkout form

Why it was not chosen: it is a check-then-act race. Stock can change between the
validation and the placement, so it would not prevent the 422 it exists to avoid —
it would only make it rarer and make the code that handles it less well tested. The
backend decides availability inside a row lock, and that is the only place it can
be decided correctly.

## Consequences

### Positive

- The cart renders instantly, offline, and while the backend is rate-limiting or
  down.
- No catalogue requests are spent on rendering a cart, which keeps ADR 0001's
  budget intact.
- There is exactly one source of truth for money, and it is not in this repository.
  No rounding bug, no currency bug, and no disagreement between the cart and the
  invoice is possible, because the storefront never computes either.
- The cart page is a pure function of `localStorage`, which makes the reducer
  trivially testable with no network at all.

### Negative

- **A cart line can show a stale price, and a sold-out variant can sit in the cart
  looking available.** The customer discovers it as a 422 at checkout. This is the
  cost of the decision and is accepted: the error names the affected line, and
  `insufficient_stock` and `variant_unavailable` both have designed handling.
- **The cart page shows no total.** This is unusual enough that it needs explicit
  copy, and it will be the first thing someone tries to "fix".
- A cart is per-device and per-browser. No sync, no recovery, and clearing site
  data loses it. There is no way to tell a customer their cart is elsewhere,
  because nothing knows.
- The storefront duplicates product display data, so a renamed product shows its
  old name in a cart until the line is removed.
- Private-mode browsers and embedded webviews can refuse storage entirely, in which
  case the cart survives only the page view.

### Constraints introduced

- **No arithmetic on money anywhere outside `lib/format/money.ts`**, which parses
  only to group digits. `Number()` and `parseFloat` applied to an amount are
  rejected in review.
- **The cart page displays no total**, and neither does the header badge beyond a
  line count.
- **`localStorage` reads are wrapped in `try`/`catch` and validated**, and any
  failure resets to empty rather than throwing.
- **The storage key is versioned** and is bumped rather than migrated.
- **Cart quantity changes never call the API.** Availability is not checked until
  checkout, deliberately.
- The cart badge renders empty on the server and fills in after hydration, because
  the server has no `localStorage`. A component that renders a count during SSR
  will produce a hydration mismatch.

## Implementation

```text
lib/cart/reducer.ts        add, remove, set quantity, merge duplicate lines
lib/cart/storage.ts        the versioned parser, try/catch, reset on failure
lib/cart/use-cart.ts       the context hook
lib/format/money.ts        the only module that parses an amount
components/cart/
app/cart/page.tsx
docs/features/cart.md
docs/features/checkout.md  the 422 handling this decision makes necessary
```

## Future reconsideration

Revisit when the backend adds a cart table, which its own documentation expects to
happen when abandoned-cart email is built. At that point the cart becomes a real
resource, this storefront's reducer becomes a client of it, and the staleness
problem disappears — but the "no arithmetic" rule should survive the change, because
it is about authority rather than about storage.

Revisit the no-total rule if the backend ever publishes a cart-pricing endpoint
that returns a subtotal and a shipping estimate for a given cart and district.
Displaying a figure the backend computed is entirely compatible with this decision;
computing one here is not.

Revisit the display-data duplication if stale cart lines generate real support
load. The cheapest fix is to re-fetch the products for a cart *older than some
threshold* rather than on every render, which keeps the common case free.
