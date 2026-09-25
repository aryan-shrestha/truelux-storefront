# Checkout

Status: Implemented

Last updated: 2026-09-25

---

## Goal

Turn the bag into a cash-on-delivery order in one form, from the customer's
browser, and handle every way the API can say no without losing what the customer
typed or placing a second order.

---

## Scope

What is included in this implementation?

- `/checkout`: contact and delivery fields, a searchable district list, the bag
  beside the form, and one submit button
- `/checkout/confirmation?order=…`: the order number and the API's amounts
- Cash on delivery only (backend ADR 0011)

What is explicitly outside the scope?

- Online payment. Khalti was removed with the backend's; adding a gateway is a
  feature, not a toggle.
- Accounts, saved addresses, a shipping quote before placement (the API has none)

---

## Context

- `POST /api/v1/checkout/` from the browser (ADR 0001), `payment_method: "cod"`.
  See [backend-api.md](../integrations/backend-api.md#checkout).
- The cart is browser state (ADR 0002); the API re-resolves every price and stock
  level at placement.
- Error codes are the contract (ADR 0005).

---

## Implemented

- `app/checkout/page.tsx` — a server shell, `noindex`, around `CheckoutForm`.
- `components/checkout/CheckoutForm.tsx` — the form, built from shadcn `FieldSet`,
  `Field`, `Input`, `Textarea`, `Card`, `Alert` and `Button`. Input names are the
  API's field names, so a 400's `details` maps onto them. The payment section is a
  `Card` stating cash on delivery; there is no choice to make. On success it records
  the order on this device, replaces the form, clears the bag and navigates to the
  confirmation.
- `components/checkout/DistrictPicker.tsx` — a `Command` list in a `Popover`,
  searchable over Nepal's 77 districts (`districts.ts`), writing a hidden
  `district` input. Submitting without one is a field error, and nothing is sent.
- `components/checkout/OrderSummary.tsx` — the bag's lines as quantity × unit price
  and "Size · Shade", the shipping note, and no total.
- `components/checkout/Confirmation.tsx` — the order number from the URL, the
  amounts from the local order record once hydrated, and the next step: the shop
  calls to confirm, and the customer pays in cash on delivery.
- `app/checkout/confirmation/page.tsx` — `notFound()` without `?order=`.
- `lib/api/orders.ts` — `submitCheckout` always sends `payment_method: "cod"`.
- `lib/orders/record.ts` — records now always carry amounts; a record without them,
  or with a payment method other than `cod`, is dropped when read.

---

## Remaining

- A shipping quote before placement. The fee is decided from the district at
  placement and returned with the order, so the customer commits without seeing it.
  This needs a backend endpoint.

---

## Decisions

### Decision: `district` is a constrained, searchable list

**Decision**

A `Command` list in a `Popover`, not a text input.

**Reason**

The backend charges the outside-valley fee for anything it does not recognise, with
no error, so a misspelt "Lalitpur" costs the customer money.

**Consequence**

The three valley districts must stay spelled as the backend's
`KATHMANDU_VALLEY_DISTRICTS`.

### Decision: no total before the order is placed

**Decision**

The summary shows lines and the shipping note, never a total.

**Reason**

ADR 0003 forbids money arithmetic, and the fee depends on the district.

**Consequence**

The first total the customer sees is the API's, on the confirmation page.

### Decision: no retries, ever

**Decision**

Every failure is shown once; nothing resubmits.

**Reason**

A retry against a checkout that may have succeeded places a second order and
decrements stock twice.

**Consequence**

The "uncertain" notice sends the customer to their email and the order lookup
rather than inviting a second attempt.

---

## Gotchas

- **`variant_unavailable` carries `variant_ids`, a list; `insufficient_stock`
  carries `variant_id`, a string.**
- **`insufficient_stock` carries no available count**, deliberately. Never write
  "only N left".
- **The checkout response never contains `access_token`.** It arrives by email.
- **The form must never unmount on a failure that placed nothing.** It is replaced
  only once an order exists, and the bag is cleared after that render
  (`flushSync`), or the empty-bag state flashes first.
- **Anything that is not an `ApiError` is uncertain**, including a 201 whose body
  could not be read. No copy says it failed.
- **The 30-per-hour limit is per IP**, so the 429 copy does not blame the customer.
- `Alert` renders `role="alert"`, so it is used only for failures; the COD note is a
  `Card`, or every page load would announce it.
- The submit button is `aria-disabled` while busy, not `disabled`, so focus stays on
  it; `handleSubmit` ignores a second press.

---

## Routes

```text
/checkout                  static shell; the form is a client component; noindex
/checkout/confirmation     dynamic (reads ?order=); noindex
```

---

## API

### Calls

```text
POST /api/v1/checkout/     browser, no-store
```

### Errors handled

| `code` | Treatment |
| --- | --- |
| `validation_error` | Messages inline on their fields and focus on the first; a 400 about `items` gets its own "could not accept your bag" notice |
| `variant_unavailable` | Names every affected line, offers to remove them, nothing was ordered |
| `insufficient_stock` | Names the line, no quantity, nothing was ordered |
| `throttled` | "The shop is busy", no retry |
| anything else, or no response | "May or may not have been placed", with the request id |

---

## State and data

- `localStorage` `tl.cart.v2` — read for the lines, cleared after placement.
- `localStorage` `tl.orders.v1` — `{ orderNumber, email, recordedAt, paymentMethod: "cod", amounts }`
  written after placement, read by the confirmation page and the lookup. Never the
  access token.
- React state — field errors, the problem notice, submitting, placed.

---

## Accessibility

- Field errors are wired with `aria-invalid` and `aria-describedby`, and focus moves
  to the first invalid field, including the district trigger.
- The count of invalid fields is a `role="status"` line beside the button; failures
  are `Alert`s.
- The district trigger is a `combobox`-role button labelled "District"; the list is
  searchable by keyboard.

---

## Tests

- `components/checkout/CheckoutForm.test.tsx` — the body carries variant ids,
  quantities, the district and `cod`, and no price; success records the order,
  clears the bag and navigates; a 400 lands on its field and keeps what was typed;
  `variant_unavailable` names and removes lines; `insufficient_stock` states no
  quantity; 429 and transport failures do not retry; a missing district is caught
  before sending; there is no payment choice and no Khalti.
- `components/checkout/districts.test.ts` — the valley districts' spelling.
- `lib/orders/record.test.ts` — records without amounts or with another payment
  method are dropped.
- `tests/e2e/buy-flow.spec.ts` — bag to confirmation with a stubbed checkout.

---

## Files

```text
app/checkout/
components/checkout/
lib/api/orders.ts
lib/orders/record.ts
```
