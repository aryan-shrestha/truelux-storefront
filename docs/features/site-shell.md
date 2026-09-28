# Site shell

Status: Implemented

Last updated: 2026-09-29

---

## Goal

The frame around every page: the announcement bar, the header with the wordmark,
the Shop and Brands menus, search and the bag; the mobile drill-down menu; the footer; the
skip link; and the root error, not-found and loading boundaries.

---

## Scope

What is included in this implementation?

- `app/layout.tsx`: fonts, root metadata, `CartProvider`, skip link, announcement
  bar, header, footer
- `components/layout/`: `AnnouncementBar`, `Header`, `HeaderFrame`, `ShopMenu`, `MobileNav`,
  `SearchSheet`, `SearchForm`, `CartButton`, `Footer`, `PageShell`,
  `SectionHeading`, `site-links.ts`, `promises.ts`
- `app/error.tsx`, `app/not-found.tsx`, `app/loading.tsx`

What is explicitly outside the scope?

- The design's language switcher, wishlist and account icons, "Log in", "Customer
  support" and store links: none exists ([ADR 0011](../decisions/0011-the-storefront-follows-the-supplied-design.md))
- The footer's newsletter signup and social links: no backend and no accounts

---

## Context

Rebuilt to `Menu dropdown- desktop.png`, `Menu---mobile-img0-375x812.png` and
`Sub Menu - mobile.png` ([design-alignment.md](design-alignment.md)). The wordmark is
`env.brandName` (ADR 0007). The cart count comes from `localStorage` and cannot
render on the server (ADR 0002). The Shop menu is built from `/categories/` and
`/skin-types/` (`../back-end/docs/features/skin-types.md`).

---

## Implemented

- `app/layout.tsx` — Noto Sans and Belleza via `next/font`; `AnnouncementBar`, a
  dark `bg-ink` strip carrying `shippingNote()` — "Free shipping over Rs 8,000 ·
  Cash on delivery", the two fees without a threshold, or "Cash on delivery" when
  `/shipping/` cannot be read (see [checkout-quote.md](checkout-quote.md)); root
  metadata as before.
- `components/layout/Header.tsx` — a Server Component inside `HeaderFrame`: reads
  categories, skin types and brands in parallel, builds the columns with
  `shopMenu()` and the brand column with `brandMenu()`, and reads the shipping copy
  for the bag, and lays out a three-column grid: the menus on the left, the wordmark centred (bold,
  tracked, uppercase, `translate="no"`), search and the bag on the right. 64px tall,
  80px from `md`, with no rule underneath (removed 2026-09-27).
- `components/layout/ShopMenu.tsx` — shadcn `NavigationMenu`, from `md`: a Shop
  trigger whose content spans the header's `max-w-page` column: one column per root
  category ("Shop all", then its children), a Skin type column after the first
  root, and an editorial image (`public/art/menu.svg`) in the right 27%. Then
  a Brands trigger whose content is the same frame: "All brands" (`/brands`) then
  every brand's page, in a wrapping grid. Then Journal (`/#journal`) as a plain
  link. With no categories, Shop is a link to `/products`; with no brands, Brands is
  a link to `/brands`. The header has no About link (removed 2026-09-27).
- `components/layout/MobileNav.tsx` — a full-width shadcn `Sheet` below `md` with
  drill-down panels built from `item` rows: Shop › (Shop everything, one row per
  column) › the column's links, with a back row at the top of each level; then
  Brands › (All brands, one row per brand), Journal, and "Find an order" and "Your
  bag" as small links.
- `components/layout/SearchSheet.tsx` + `SearchForm.tsx` — the header's search icon
  opens a top `Sheet` holding a `next/form` GET form to `/products?search=`, which
  navigates client-side and closes the sheet.
- `components/layout/CartButton.tsx` — the count sits as text beside the bag icon,
  as in the design; passes the server's shipping copy to the bag sheet, which
  quotes the bag while open (checkout-quote.md).
- `components/layout/Footer.tsx` — `bg-ink`: the wordmark and one line about the
  shop, then Shop, Categories (the root categories) and Orders columns from `md`,
  and the same columns as a plus/minus `Accordion` below `md`; the year.
- `components/layout/PageShell.tsx` — the frame of the pages the design has no
  mockup for (bag, checkout, orders, brands): page width and the serif title.
- `components/layout/SectionHeading.tsx` — the design's section opener: a small line
  above a Belleza title, and an optional lede.
- `components/layout/promises.ts` — the cash-on-delivery, authenticity and delivery
  claims, shared by the home page and every product page.

---

## Remaining

None.

The header's brand read shares the brands page's and the listing's cache key
(`/brands/`, 3600s), already counted among the five reference lists in
`architecture.md`'s request budget, so the budget is unchanged.

---

## Decisions

### Decision: one menu model for both menus

**Decision**

`shopMenu(categories, skinTypes)` in `lib/catalog/navigation.ts` returns the
columns; the desktop mega-menu and the mobile drill-down both render it.

**Reason**

The two menus must offer the same destinations; one tested function keeps them
from drifting.

**Consequence**

The skin-type column's position (after the first root) is decided in one place.

### Decision: the header is server-rendered with small client islands

**Decision**

`HeaderFrame`, `MobileNav`, `SearchSheet` and `CartButton` are the only client
components in the shell. `ShopMenu` is a Server Component; Radix carries its own
client boundary.

**Reason**

The header is on every route; the menu data should not ship twice.

**Consequence**

The category, skin-type and brand reads happen once per render on the server and are
deduplicated with the page's own.

### Decision: About and Journal are anchors on the home page

**Decision**

The header's Journal link and the footer's About and Journal links go to
`/#journal` and `/#about`. The header dropped About on 2026-09-27, at the client's
request; the footer keeps it.

**Reason**

The design has both, and there are no such pages or content behind them; inventing
routes is out of scope.

**Consequence**

Removing either section's `id` breaks a header link.

---

## Gotchas

- **The navigation menu's root is `static`** (in `components/ui/navigation-menu.tsx`),
  so its viewport is positioned against the header's `max-w-page` column (made
  `relative` in `Header.tsx`) and spans that, not the screen. The
  viewport sits at `top-full`; the header has no bottom rule any more. Restoring the
  rule means moving the viewport to `top-[calc(100%+1px)]`, or the menu covers it.
- **An open mega-menu locks the page's scroll** with a CSS rule in
  `app/globals.css` (`html:has([data-slot="navigation-menu-viewport"][data-state="open"])`),
  not with state: `ShopMenu` stays a Server Component. `scrollbar-gutter: stable`
  keeps the header from shifting when the scrollbar goes. Renaming the viewport's
  `data-slot` silently removes the lock.
- **Radix wraps the menu list in an unstyled `div`**; the root gives its first child
  `h-full`, or the open trigger's underline sits under the text instead of on the
  header's bottom edge.
- **The mobile sheet needs `data-[side=left]:w-full`**, not `w-full`: the generated
  `data-[side=left]:w-3/4` outranks a plain utility.
- **The cart count must not render on the server**, or React discards the header's
  server markup on hydration.
- **The header's height is fixed** (`h-16`, `md:h-20`), not `--header-offset`, which
  drops to 0 when the header hides.
- Search needs JavaScript to open its sheet. The form inside works without it.

---

## Routes

None of its own beyond the boundaries.

---

## API

### Calls

```text
GET /api/v1/categories/    server, revalidate 3600 (navigationCategories, degrades to [])
GET /api/v1/skin-types/    server, revalidate 3600 (navigationSkinTypes, degrades to [])
GET /api/v1/brands/        server, revalidate 3600 (navigationBrands, degrades to [])
GET /api/v1/shipping/      server, revalidate 3600 (shippingNote, degrades to "Cash on delivery")
```

---

## State and data

- `localStorage` `tl.cart.v2`, read for the count after hydration.
- React state: the menu, search and bag sheets' open state, the mobile menu's
  panel, the header's hidden state.

---

## Accessibility

- A skip link to `#main` is the first focusable element.
- The mega-menu is Radix `NavigationMenu`: keyboard-operable, Escape closes it, and
  each column is a region named by its title.
- A mobile sub-menu's back row takes focus when it opens, so a keyboard user is not
  left on a removed element. Rows are 56px tall.
- Every sheet has a title ("Menu", "Search", "Your bag") and traps and restores
  focus.
- The header reappears when anything inside it takes focus.

---

## Tests

- `lib/catalog/navigation.test.ts` — `brandMenu`: All brands first, then each
  brand's page in the API's order, and no menu for an empty list; `shopMenu`: a column per root opening with
  Shop all, the skin-type column after the first root with `?skin_type=` links, a
  childless root, no skin-type column when the API lists none; `findCategory`.
- `lib/shipping/note.test.ts` — the announcement copy with and without a
  threshold, and a failed read.
- `components/layout/CartButton.test.tsx` — the count after hydration, the announced
  name, no zero, the sheet on a plain click, a modified click left to the browser,
  focus returned on close.
- `components/layout/header-scroll.test.ts`.
- `tests/e2e/buy-flow.spec.ts` — the mega-menu opens a skin type and a whole root.

---

## Files

```text
app/layout.tsx
app/error.tsx
app/not-found.tsx
app/loading.tsx
components/layout/
components/ui/navigation-menu.tsx
components/ui/item.tsx
lib/catalog/navigation.ts
public/art/menu.svg
```
