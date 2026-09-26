# Features

Current feature inventory.

Phase 1 is the storefront for TrueLux, a multi-brand cosmetics retailer in Nepal
selling skincare, makeup and fragrance. It owns no data: the Django API owns the
catalogue, the orders and the money, and this repository's job is to render that
well and hand a bag back as an order. Checkout is guest-only and cash on delivery
only, and there is no authentication anywhere.

| #   | Feature            | Status      | Documentation                    | Depends on | Last updated |
| --- | ------------------ | ----------- | -------------------------------- | ---------- | ------------ |
| 1   | design-system      | Implemented | `features/design-system.md`      | 11         | 2026-09-26   |
| 2   | api-client         | Implemented | `features/api-client.md`         | —          | 2026-09-26   |
| 3   | site-shell         | Implemented | `features/site-shell.md`         | 1, 2       | 2026-09-26   |
| 4   | catalog-browsing   | Implemented | `features/catalog-browsing.md`   | 2, 3       | 2026-09-26   |
| 5   | product-detail     | Implemented | `features/product-detail.md`     | 4          | 2026-09-26   |
| 6   | cart               | Implemented | `features/cart.md`               | 5          | 2026-09-25   |
| 7   | checkout           | Implemented | `features/checkout.md`           | 6          | 2026-09-25   |
| 8   | order-status       | Implemented | `features/order-status.md`       | 7          | 2026-09-25   |
| 9   | storefront-home    | Implemented | `features/storefront-home.md`    | 4, 12      | 2026-09-26   |
| 10  | seo-and-metadata   | In progress | `features/seo-and-metadata.md`   | 4, 5, 9    | 2026-09-26   |
| 11  | shadcn-foundation  | Implemented | `features/shadcn-foundation.md`  | —          | 2026-09-26   |
| 12  | brands             | Implemented | `features/brands.md`             | 2, 4, 11   | 2026-09-26   |
| 13  | shades-and-sizes   | Implemented | `features/shades-and-sizes.md`   | 2, 4, 5, 11 | 2026-09-26  |
| 14  | design-alignment   | Implemented | `features/design-alignment.md`   | 1, 3, 4, 5, 9, 11 | 2026-09-26 |

`Depends on` refers to the `#` column of this table.

## State of the phase

**Everything is built except `Product` JSON-LD (#10).** The fork from the clothing
storefront was turned into TrueLux on 2026-09-25: shadcn/ui replaced the hand-built
primitives (#11), brands (#12) and shades and sizes (#13) arrived with the backend's
new contract, and online payment was removed in favour of cash on delivery (backend
ADR 0011). On 2026-09-26 the whole storefront was restyled to the client's mockups
(#14, ADR 0011, superseding ADR 0010's direction), with skin types, the product care
details and a mega-menu from the backend's skin-types contract.

**Verified against unit tests, component tests and a local stub of the API, not yet
against the real backend.** The Playwright spec passed against a stub shaped like
the contract docs; it is written for the backend's `seed_demo` data and has not been
run against it. The skin-types backend change was being built in parallel.

Things worth knowing, each recorded in its feature document:

- **An unknown `?brand=` or `?skin_type=` slug is a 400 from the API**, unlike the
  other filters. The listing turns it into its empty state (#4, #12).
- **`?category=<root>` now includes its children**, which is what the menus' "Shop
  all" links rely on (#4, #14).
- **The facet lists are facets**, not lookup tables: `/shades/`, `/sizes/` and
  `/skin-types/` list only values in use by a visible product (#13, #14).
- **The catalogue request budget was redone again** for the mega-menu, skin types
  and related products: the listing now revalidates every 10 minutes, related
  products hourly, and the budget holds to roughly 150 products (`architecture.md`).
- **Only categories are always visible on the listing**; the other facets are in a
  panel that needs JavaScript to open when nothing is applied (#4, #14).
- **The product page needs the backend's skin-types fields**; deploy the backend
  first (#5).
- **`toggle.tsx` has no `"use client"`**, so the Server Component filter panel can
  style its links with `toggleVariants` (#11). Found by rendering the page, not by
  the tests.
- **The cart's storage key is `tl.cart.v2`**; v1 lines had a colour (#6, #13).
- **`pending` now means "placed, awaiting the shop's call"**, and `confirmed`
  replaced `paid` (#8).

## Architectural decisions

| ADR  | Decision                                                      | Governs                                            |
| ---- | ------------------------------------------------------------- | -------------------------------------------------- |
| 0001 | The browser makes every customer-scoped call                  | api-client, catalog-browsing, checkout, order-status |
| 0002 | The cart is browser state; the server owns price and stock    | cart, checkout, product-detail                     |
| 0003 | Money is a decimal string end to end                          | api-client, cart, checkout, every price            |
| 0004 | Catalogue state lives in the URL                              | catalog-browsing, brands, seo-and-metadata         |
| 0005 | The storefront branches on the API's error codes              | api-client, checkout, order-status                 |
| 0006 | ~~The storefront keeps its own order record~~ **superseded**  | checkout, order-status                             |
| 0007 | The brand wordmark is configuration (amended by 0010)         | design-system, site-shell                          |
| 0008 | ~~The storefront follows the supplied home design~~ **superseded by 0010** | —                                     |
| 0009 | shadcn/ui is the component library                            | shadcn-foundation, every component                 |
| 0010 | ~~The TrueLux visual direction~~ **superseded by 0011**       | —                                                  |
| 0011 | The storefront follows the supplied design                    | design-system, design-alignment, site-shell, storefront-home, catalog-browsing, product-detail |

ADR 0001 is the one to read first: the query normaliser, `robots.ts` and the
revalidation intervals all exist to protect its request budget.

## Integration references

[backend-api.md](../integrations/backend-api.md) transcribes the Django API's
public surface: every endpoint the storefront calls, every field, the error
envelope and codes, the throttle rates, and what the API does not offer. The
backend repository is authoritative; if the two disagree, this transcription is
stale.

## Deferred to Phase 2 and later

Customer accounts and order history, saved addresses, wishlist, reviews, discount
codes, online payment, shade finders, restock notifications, a persisted server-side
cart, analytics, and content management for the home page.

Worth raising with the backend first, because each removes a compromise recorded
above:

- **A shipping quote before placement** (#7).
- **Child-category filtering**: `?category=` matches one category exactly (#4).
- **An image field on categories**, so the home page's category tiles can show the
  category rather than a placeholder by position (#9).

## Status definitions

- **Planned** — documented but implementation has not started.
- **In progress** — implementation has started but is incomplete.
- **Implemented** — documented scope is implemented and verified.
- **Blocked** — implementation cannot continue because of a documented blocker.
- **Deprecated** — feature exists but should not receive new development.
