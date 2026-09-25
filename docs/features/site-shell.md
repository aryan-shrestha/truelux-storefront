# Site shell

Status: Implemented

Last updated: 2026-09-25

---

## Goal

The frame around every page: the header with the wordmark, navigation, search and
the bag; the footer; the skip link; and the root error, not-found and loading
boundaries.

---

## Scope

What is included in this implementation?

- `app/layout.tsx`: fonts, root metadata, `CartProvider`, skip link, header, footer
- `components/layout/`: `Header`, `HeaderFrame`, `MobileNav`, `SearchForm`,
  `CartButton`, `Footer`, `site-links.ts`
- `app/error.tsx`, `app/not-found.tsx`, `app/loading.tsx`

What is explicitly outside the scope?

- Accounts and a wishlist (the API has neither), language switching, a contact page

---

## Context

The wordmark is `env.brandName`, configuration rather than a constant (ADR 0007),
set in the display serif (ADR 0010). The cart count comes from `localStorage` and
cannot render on the server (ADR 0002).

---

## Implemented

- `components/layout/Header.tsx` — a Server Component inside `HeaderFrame`: a
  three-column grid with the site links in a shadcn `NavigationMenu` (and the mobile
  menu below `md`), the wordmark centred, and search (from `lg`) plus the bag on the
  right. It reads categories for the mobile menu through `navigationCategories()`.
- `components/layout/site-links.ts` — Shop (`/products`), Brands (`/brands`), New in
  (`/products?ordering=-created_at`).
- `components/layout/HeaderFrame.tsx` — the one client boundary of the header's
  frame: it slides the header away while scrolling down and back on scroll up (a
  CSS transform), shows it on focus, and sets `data-header-hidden` on `<html>`, which
  moves `--header-offset` for the sticky filter rail and product column.
- `components/layout/MobileNav.tsx` — a shadcn `Sheet` from the left, with search,
  the site links and the category tree; links close it.
- `components/layout/SearchForm.tsx` — a GET form to `/products` with an
  `InputGroup`, working without JavaScript.
- `components/layout/CartButton.tsx` — a link to `/cart` that opens the bag in a
  right-hand `Sheet` on a plain click, and navigates on a modified or middle click.
  The count `Badge` appears only after storage is read; the accessible name
  ("Bag, 2 items") is a polite live region. Focus returns to the link when the sheet
  closes.
- `components/layout/Footer.tsx` — the wordmark, one line about the shop, links to
  the shop pages, the order lookup and the bag, and the year.
- `app/layout.tsx` — Cormorant Garamond and Manrope via `next/font`; `metadataBase`,
  the title template "%s | {brand}", the description, Open Graph site name and
  locale, and a `same-origin` referrer policy.
- `app/error.tsx`, `app/not-found.tsx`, `app/loading.tsx` — shadcn `Button`s and
  `Skeleton`s on the theme; the error boundary shows only the request id.

---

## Remaining

None.

---

## Decisions

### Decision: the header is server-rendered with small client islands

**Decision**

`HeaderFrame`, `MobileNav` and `CartButton` are the only client components in the
shell.

**Reason**

The header is on every route; marking it client would ship the category data twice
and put navigation behind hydration.

**Consequence**

The category fetch happens once per render on the server and is deduplicated with
the home page's and the listing's.

### Decision: the inherited wishlist and account icons are gone

**Decision**

The header shows search and the bag, nothing inert.

**Reason**

The API has no wishlist and no accounts; a control that does nothing is noise.

**Consequence**

Adding either is a feature with an API behind it.

---

## Gotchas

- **The cart count must not render on the server**, or React discards the header's
  server markup on hydration.
- **The header's height is fixed** (`h-16`, `md:h-18`), not `--header-offset`, which
  drops to 0 when the header hides.
- **`metadataBase` must be set** or production Open Graph URLs resolve to localhost.
- The bag sheet has no Radix trigger (the opener is a link), so focus is returned to
  the link by hand in `onCloseAutoFocus`.
- An error boundary must never render an order's access token.

---

## Routes

None of its own beyond the boundaries.

---

## API

### Calls

```text
GET /api/v1/categories/    server, revalidate 3600 (navigationCategories, degrades to [])
```

---

## State and data

- `localStorage` `tl.cart.v2`, read for the count after hydration.
- React state: the menu and bag sheets' open state, the header's hidden state.

---

## Accessibility

- A skip link to `#main` is the first focusable element.
- The header reappears when anything inside it takes focus.
- Both sheets have titles ("Menu", "Your bag") and trap and restore focus.

---

## Tests

- `components/layout/CartButton.test.tsx` — the count after hydration, the announced
  name, no zero badge, the sheet on a plain click, a modified click left to the
  browser, focus returned on close.
- `components/layout/header-scroll.test.ts` — hide on the way down, show on the way
  up, ignore jitter, always shown near the top.

---

## Files

```text
app/layout.tsx
app/error.tsx
app/not-found.tsx
app/loading.tsx
components/layout/
```
