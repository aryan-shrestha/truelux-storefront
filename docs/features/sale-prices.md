# Sale prices

Status: Planned

Last updated: 2026-09-29

---

## Goal

Make sales visible and easy to find. A product on sale shows what the customer
pays, the struck-through "was" price and the saving, and one place lists
everything on sale.

---

## Scope

What is included in this implementation?

- **Product card:** when `on_sale`, it shows `sale_price`, then `compare_at_price`
  struck through (`<s>` with a visually hidden "Was" for screen readers), and a
  "−15%" shadcn `badge` built from `discount_percent`. When the product is not on
  sale, the card is unchanged and shows `base_price`.
- **Product detail:**
  - The price block follows the selected variant: its `price`, plus its
    `compare_at_price` and badge when the variant's `on_sale` is true.
  - Before a variant is chosen, it uses the product-level sale fields, the same
    way the card does.
  - Picking a variant that is not on sale removes the struck price and the
    badge.
  - A small "Sale" marker also appears next to on-sale shade and size options.
- **Listing filter:** an "On sale" toggle in the filter panel, stored as
  `?on_sale=true` in the URL (ADR 0004). It is a link, like every other filter,
  and passes through the URL normaliser.
- **Navigation:** a "Sale" link in the header and the mobile menu, pointing to
  `/products?on_sale=true`. The listing's hero reads "Sale" when that filter is
  the only one applied.
- **Home:** an "On sale" rail. It uses the existing rail component and reads
  `?on_sale=true&limit=8`. The rail is hidden when nothing is on sale.
- **Bag and checkout:** no change. The quote prices from `price`, and lines
  still show the price paid.
- `lib/api/types.ts`, `lib/api/catalog.ts` and `docs/integrations/backend-api.md`
  are updated to the new fields.

What is explicitly outside the scope?

- Countdown timers and "ends soon" copy. The API has no sale dates.
- Any percentage or saving computed in the storefront. `discount_percent`
  comes from the API, and money stays a string (ADR 0003).

---

## Context

- Backend contract: `../back-end/docs/features/sale-prices.md` and back-end
  ADR 0018.
- Every component is shadcn (ADR 0009). The storefront is light only
  (ADR 0012), so strip `dark:` classes from any newly added component.
- **Request budget:** the home rail is a new catalogue cache key. Redo the
  arithmetic in `docs/architecture.md`.

---

## Tests

To be written:

- Card rendering: on sale versus not; the struck price carries accessible
  "Was" text; the badge text comes from `discount_percent`.
- The product detail price block follows the selected variant, both on sale
  and not.
- Query parsing round-trips `on_sale=true` and drops other values.
- The filter link's `href` and active state.
- The home rail is hidden when it has no products.
- The mega-menu and mobile menu include "Sale".
