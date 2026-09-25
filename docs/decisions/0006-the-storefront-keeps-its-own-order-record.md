# ADR 0006: The storefront keeps its own order record, because there is no confirmation email

Status: Superseded

Date: 2026-09-21

Superseded: 2026-09-23, by the backend shipping `transactional-email`

Supersedes: None

---

## What replaced it

The backend implemented `transactional-email` on 2026-09-23.
`apps/orders/emails.py` sends a confirmation from inside `place_order`, linking
to `{STOREFRONT_URL}/orders/{access_token}`, for **both** payment methods.

The premise below — that nobody will ever send a cash-on-delivery customer their
access token — is therefore false, and everything this decision justified on that
basis goes with it:

- **The confirmation page must not say "no email is coming".** It would be a lie.
  It says an email is on its way, and still shows the order number, because a
  customer who mistyped their address has nothing else.
- **The lookup prefill is a convenience, not a mitigation.** It still saves a
  customer spending one of twenty hourly attempts guessing which address they
  used, which is worth having. It is no longer the only thing standing between
  them and an unreachable order.
- **The local order record survives on its own terms** as a recent-orders list.
  Same code, much smaller claim.

What has *not* changed is the credential rule: **the access token is still never
written to storage.** That was never about the email, and now that a token
arrives by a second channel it matters more rather than less.

The email also strengthens
[order-status.md](../features/order-status.md)'s cross-repo contract. Two
channels now point at `/orders/<access_token>` — the Khalti return redirect and
every confirmation email ever sent. A rename of that route breaks both, including
for orders placed months earlier.

The original decision is kept below, unedited, because the reasoning is what
makes the current shape legible.

---

## Context

The backend's design for order access is coherent and complete on paper. An order
carries an `access_token`; the confirmation email contains a link embedding it;
`GET /orders/{access_token}/` returns the order. The order number plus the email
address is a throttled fallback for a customer who deleted the email.

The email does not exist. `transactional-email` is Planned in the backend's own
feature index, and its own documentation states the consequence plainly: *"Until #9
lands the customer never receives their `access_token`, so the order-number lookup
and the admin are the only routes back to an order."*

The checkout response does not carry the token either — deliberately, and tested
for. `test_checkout_response_never_contains_access_token` exists specifically to
keep it out.

That leaves two paths, and they differ sharply:

- **Khalti.** The customer pays, the backend verifies, and it redirects the browser
  to `{storefront}/orders/{access_token}`. The token arrives in the URL bar. The
  customer has a link, if they think to keep it.
- **Cash on delivery.** No redirect, no token, no email. The checkout response
  carries an order number and nothing else. **Nobody, anywhere, will ever send this
  customer their access token.**

So a COD customer who closes the tab has one route back to their order: remember
the order number, remember which email they typed, and find the lookup page. The
lookup is rate-limited to twenty attempts an hour per IP, returns an identical 404
for a wrong email and a nonexistent order, and is the single most-guessed thing a
frustrated customer will get wrong.

The storefront cannot fix any of that. It is the only component that knows the
order number at the moment it is issued.

## Decision

**The storefront remembers the orders placed on this device, in `localStorage`,
under `tl.orders.v1`.**

Each record holds what the checkout response returned and nothing more:

```text
orderNumber      from the checkout response
email            as typed, so the lookup can be prefilled
placedAt         when this device placed it
paymentMethod
total            for display in a list
```

**No access token is ever stored.** When one arrives in a Khalti return URL it
stays in the URL for the life of that page view and goes nowhere else.

The record is used for three things and no others:

1. The confirmation page shows the order number prominently, with an explicit
   instruction to keep it, because there is no email coming.
2. `/orders/lookup` prefills the order number and email from the most recent
   record, so the customer with the most likely need spends none of their twenty
   attempts.
3. A short "your recent orders" list offers a one-click lookup for each.

The record is a **convenience, never a credential**. Every path from it still goes
through the backend's lookup endpoint with the email, and the storefront asserts
nothing about the order it has not just been told.

## Reason

This is a gap in another repository's roadmap, and the storefront is where its
consequences land. Refusing to mitigate it on the grounds that it is not our bug
means a customer who paid cash on delivery has no way to check their own order.

Storing the order number is safe in a way storing a token would not be. An order
number is not a credential — the backend treats it as speakable, loggable, and
quotable over the phone, and it requires the matching email before it returns
anything. `localStorage` on the customer's own device holding their own order
number, alongside the email they typed themselves, adds no exposure that the
customer does not already have.

Prefilling the lookup is the part that matters most. Twenty attempts an hour sounds
generous until a customer is guessing which of two email addresses they used, at
which point it is a lockout. Prefilling turns a guess into a click.

Deliberately not storing the access token keeps the security properties the backend
designed. The token is a bearer credential; putting it in `localStorage` gives it a
lifetime longer than the page view, a second place to leak from, and no
corresponding benefit — the lookup already works without it.

## Alternatives considered

### Do nothing and rely on the order-number lookup

Why it was not chosen: it is defensible on the grounds that the backend owns this
problem. It means a COD customer's only record of their order is whatever they
happened to read off a confirmation page before closing it, and their only route
back is a rate-limited form where a wrong email is indistinguishable from a wrong
order number. That is a support burden the merchant absorbs, for a mitigation that
costs one `localStorage` key.

### Store the access token when it arrives from the Khalti return

Why it was not chosen: it would let the storefront offer a durable link to the
order for Khalti customers. It stores a bearer credential beyond its necessary
lifetime, in a place any script on the origin can read, to save a customer one form
submission — and it does nothing at all for COD customers, who are the ones with
the actual problem.

### Email the customer from the storefront

Why it was not chosen: it would require the storefront to hold a mail provider's
credentials, which would make it the first secret in a repository that currently
has none, and it would duplicate a feature the backend has already designed and
scheduled. It would also be sending an email about an order the storefront cannot
verify exists.

### Block cash on delivery until the backend can email

Why it was not chosen: cash on delivery is how most of this brand's customers
already pay, and Khalti carries an NPR 200 per-transaction ceiling until the
merchant completes KYC. Disabling COD would disable most of the shop to avoid a
support inconvenience.

### Put the order number in the URL, `/checkout/confirmation?order=TL-...`

Why it was not chosen: it makes the confirmation page refreshable and shareable,
which is a real gain, and it should probably be done *as well*. It does not survive
the tab closing, which is the case this decision exists for. The two are
complementary, not alternatives.

## Consequences

### Positive

- A customer who closes the tab can still find their order, on that device, in one
  click.
- The twenty-an-hour lookup limit stops being a practical obstacle for the common
  case.
- The confirmation page can tell the truth — "no email is coming, keep this number"
  — instead of the conventional lie that a confirmation is on its way.
- No credential is stored, so the storefront's exposure is unchanged.

### Negative

- **It does not survive a cleared browser, a different device, or a private
  window.** A customer who checks out on a phone and looks on a laptop gets
  nothing, and that is the case most likely to generate the support contact this
  was meant to prevent.
- It is a local record of a remote fact, so it can be wrong — an order shown in the
  list may have been cancelled, and the storefront will not know until the lookup
  runs.
- It is one more versioned storage schema to parse defensively and one more thing
  to reset when it fails to parse.
- **It exists because of a gap in another repository, which makes it the kind of
  code that outlives its reason.** Nothing will signal that it has become
  unnecessary.

### Constraints introduced

- **The access token is never written to storage**, by this feature or any other.
- **The local record is never treated as proof.** Every read of an order goes
  through the API; the record supplies inputs to a form and nothing else.
- **The confirmation page must state that no email is coming**, for as long as that
  is true. When the backend ships confirmation email, that copy is wrong and
  becomes a bug.
- The stored email is a customer's own address on their own device; it is never
  sent anywhere except back to the lookup endpoint that already has it.
- The record is parsed and validated like any other storage, and resets to empty on
  failure.

## Implementation

```text
lib/orders/record.ts             read, append, and the versioned parser
lib/orders/record.test.ts
app/checkout/confirmation/page.tsx   the order number and the "no email" copy
app/orders/lookup/page.tsx           prefill, and the recent-orders list
docs/features/checkout.md
docs/features/order-status.md
```

## Future reconsideration

**This happened.** The condition named here — the backend shipping
`transactional-email` — was met on 2026-09-23, two days after this was written.
See "What replaced it" above.

The remaining trigger still stands: the backend adding customer accounts in Phase
2 replaces the recent-orders list entirely with real order history, at which point
the local record should be deleted rather than kept alongside it.
