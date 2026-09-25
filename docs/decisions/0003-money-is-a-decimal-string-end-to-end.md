# ADR 0003: Money is a decimal string end to end

Status: Accepted

Date: 2026-09-21

Supersedes: None

---

## Context

Every amount the API sends is a string: `"4500.00"`, `"150.00"`, `"4650.00"`. They
come from a PostgreSQL `numeric(10, 2)` and DRF serialises that as a string
deliberately, so that the exact decimal value survives the wire.

JavaScript has no decimal type. `JSON.parse` on a number produces an IEEE 754
double, and the moment an amount becomes a double it stops being the amount:

```js
0.1 + 0.2;              // 0.30000000000000004
4500.0 * 3;             // 13500.000000000002  (at other magnitudes)
(1150.35).toFixed(1);   // "1150.3"  — banker's-adjacent rounding, not the one
                        //            an invoice uses
```

This is a storefront for a brand whose prices run to four and five digits in
rupees, and whose customers will compare a figure on a product page against a
figure on a Khalti receipt. A discrepancy of one paisa in either direction is a
support conversation, and a discrepancy that appears only sometimes is a support
conversation that recurs.

The tempting shape is a `Money` class, or a decimal library, with arithmetic that
is correct. That would be the right answer if the storefront needed to do
arithmetic. It does not, and [ADR 0002](0002-the-cart-is-browser-state.md) is why:
the backend computes every subtotal, every shipping fee and every total, inside the
transaction that places the order.

## Decision

**An amount is a `string` from the API to the pixel, and nothing in this repository
converts one to a number.**

```ts
export type Money = string; // a decimal string, e.g. "4500.00"
```

`lib/format/money.ts` is the **only** module permitted to parse an amount, and it
parses only to group digits for display:

```ts
formatPrice("4500.00"); // "Rs 4,500"
```

`Number()`, `parseFloat`, `parseInt`, unary `+` and arithmetic operators applied to
an amount are rejected in review everywhere else in the repository.

There is no decimal library, no `Money` class, and no minor-unit integer
representation.

## Reason

The rule is enforceable because there is nothing to enforce it against. The
storefront displays amounts and sends none — checkout accepts no price field at
all, and the backend would ignore one if it did. Every figure shown to a customer
arrives from the API already computed. A type that is just `string` therefore costs
nothing and closes the failure entirely, because the unsafe operation is not merely
discouraged, it is absent.

A decimal library would be the correct choice for code that computes. Here it would
be a dependency, a bundle cost, and a set of `new Decimal(...)` calls at the
boundary, all to make arithmetic safe that this repository has decided not to
perform. It would also quietly legitimise performing it: once the safe tool is
present, summing a cart looks reasonable, and the reason not to sum a cart is not
precision — it is that the storefront does not know the shipping band.

Minor units — an integer count of paisa — is how the backend talks to Khalti, and
it is the standard answer in payment code. It is wrong at this boundary because the
API does not send paisa. Converting `"4500.00"` to `450000` on receipt means a
parse, a multiplication and a rounding decision on every amount, which is three
opportunities for exactly the bug being avoided, in exchange for arithmetic nobody
performs.

`Money` as a bare type alias rather than a branded type is a deliberate limit.
Branding it would catch a raw string passed where an amount belongs, but the values
all originate in one module and flow to one formatter, so the brand would guard a
path with no fork in it. The `typescript-best-practices` skill prefers brands for
primitives that can be confused; this one travels too short a distance to be
confused.

## Alternatives considered

### Parse to `number` at the API boundary

Why it was not chosen: it is what most TypeScript codebases do, it makes every
amount ergonomic, and for display-only values at these magnitudes it would usually
be fine. "Usually fine" is the problem — the failures are rare, magnitude-dependent
and invisible in testing, and they surface as a customer saying the price changed.
It also erases the distinction the backend went to trouble to preserve.

### A `Money` class or a decimal library (`decimal.js`, `dinero.js`)

Why it was not chosen: correct, well-tested, and solving a problem this repository
does not have. It adds a dependency and a boundary conversion to enable arithmetic
that ADR 0002 forbids on authority grounds rather than on precision grounds. If the
arithmetic ban is ever lifted, this is the first thing to reach for — not before.

### Integer minor units (paisa)

Why it was not chosen: the API speaks decimal rupees, so this requires a lossy
conversion in and out at every boundary. It is the right representation for code
that *moves* money, and the backend uses it for exactly that when talking to
Khalti. The storefront moves none.

### A branded type, `string & { readonly __brand: "Money" }`

Why it was not chosen: it would prevent an arbitrary string being formatted as an
amount, which is a mistake nobody has a route to make here — amounts come from one
module and go to one function. The branding would need a construction site at the
API boundary and casts in every test fixture, for a class of error with no
observed path. Worth revisiting if amounts ever originate anywhere but `lib/api`.

## Consequences

### Positive

- No rounding error, no floating-point artefact, and no disagreement between a
  price on a page and a price on a receipt is possible, because no conversion
  happens.
- The rule is mechanically checkable: a `Number(` or `parseFloat(` near an amount
  is a review finding, and a lint rule can find most of them.
- No dependency, no bundle cost, no boundary conversion.
- The type documents itself. A function taking `Money` cannot be passed a computed
  figure, because there are none.

### Negative

- **Sorting by price cannot be done client-side**, because `"900.00" > "4500.00"`
  is true as a string comparison. Ordering is the API's `?ordering=base_price`, and
  any client-side sort would have to violate this decision to work.
- **Comparing two amounts requires the API too.** Nothing in the storefront can
  answer "is this variant more expensive than the base price" without parsing, so
  UI that wants to say "from Rs X" must take the figure the API gives rather than
  derive it.
- A developer's first instinct — `item.unitPrice * item.quantity` — is wrong and
  will be written at least once. It has to be caught in review.
- `formatPrice` is a small parser of a format the API controls. A schema change on
  the backend to three decimal places would break the display, not the data.

### Constraints introduced

- **`lib/format/money.ts` is the only module that parses an amount.** Nothing else
  may.
- **The cart page displays no total**, which is also required by
  [ADR 0002](0002-the-cart-is-browser-state.md) for a different reason. Both
  reasons must be removed before a total can appear.
- **Price sorting and price filtering are query parameters**, never client-side
  operations.
- Test fixtures use realistic decimal strings, including one with non-zero paisa,
  so that a formatter that only ever sees `.00` is not mistaken for a correct one.
- Amounts are never used as object keys, in `Math` calls, or in comparisons.

## Implementation

```text
lib/api/types.ts           the Money alias and every field typed with it
lib/format/money.ts        formatPrice, the only parser
lib/format/money.test.ts   grouping, paisa, and the values that break naive code
components/                every price rendered through formatPrice
docs/convention.md         the rule and its enforcement
```

## Future reconsideration

Revisit if the storefront ever has to compute an amount — a live shipping estimate
before checkout, a discount preview, or a cart total the backend has agreed to
stand behind. At that point adopt a decimal library, convert at the `lib/api`
boundary, and keep the string on the wire. Do not reach for `number` as an
intermediate step.

Revisit the bare alias in favour of a brand if amounts ever originate outside
`lib/api` — from a form, a URL parameter, or storage — because that is the point at
which a wrong string could reach a function expecting a right one.

Revisit if the backend adds a currency field. A `Money` that carries only a
magnitude stops being sufficient the moment two currencies exist, and the change
would be to a `{ amount: string; currency: string }` pair rather than to a number.
