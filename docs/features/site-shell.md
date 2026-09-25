# Site shell

Status: Implemented

Last updated: 2026-09-24

---

## Goal

Build the frame every page sits inside: the root layout, the header and its
navigation, the footer, the default metadata, and the error and not-found
boundaries.

---

## Scope

What is included in this implementation?

- `app/layout.tsx` — fonts, tokens, the metadata template, the shell
- `components/layout/Header.tsx` — the wordmark, category navigation, cart count
- `components/layout/Footer.tsx`
- Mobile navigation, as a dialog
- `app/error.tsx`, `app/not-found.tsx`, `app/loading.tsx`
- The category fetch that feeds navigation, and its caching
- Default metadata, `metadataBase`, and the title template

What is explicitly outside the scope?

- The design tokens and primitives, which belong to `design-system.md`
- The home page's content, which belongs to `storefront-home.md`
- The cart's contents and behaviour, which belong to `cart.md` — the header shows
  a count and opens the drawer, nothing more
- Sitemap, robots and per-page metadata, which belong to `seo-and-metadata.md`
- Search as a feature; the header's search entry point links to the listing

---

## Context

The header is the only component rendered on every route, which makes it the one
place a mistake is global.

It carries three things that each come from somewhere different: the **wordmark**
from `env.brandName`
([ADR 0007](../decisions/0007-the-brand-wordmark-is-configuration.md)), the
**category navigation** from `GET /api/v1/categories/`, and the **cart count** from
`localStorage` ([ADR 0002](../decisions/0002-the-cart-is-browser-state.md)).

Those three have incompatible rendering characteristics. The wordmark is a build-
time constant. The categories are a cached server fetch. The cart count cannot
exist on the server at all. A header written as one client component would drag
the whole shell into the browser and forfeit server rendering on every page.

The category endpoint also has two properties worth knowing before designing a
menu: it returns a **bare array** with no pagination envelope, and its nesting is
**presentational only** — `?category=` matches one category exactly and does not
descend into children.

---

## Planned

### Root layout

```tsx
export const metadata: Metadata = {
  metadataBase: new URL(env.siteUrl),
  title: { default: env.brandName, template: `%s — ${env.brandName}` },
};
```

Fonts loaded through `next/font/google` — Archivo with its width axis, Newsreader
for prose — both as CSS variables consumed by `@theme`. Self-hosted by `next/font`,
so no request leaves the page for a stylesheet.

`<html lang="en">`. The store is in English; see `convention.md` on why there is no
translation layer.

### Header

A server component that fetches categories and renders the wordmark and
navigation, with exactly two client components inside it:

```text
Header                    server — wordmark, nav links
├── CartButton            client — reads localStorage, opens the drawer
└── MobileNav             client — the dialog; receives categories as props
```

`MobileNav` receives the category list as props rather than fetching it, so the
data crosses the boundary once and the fetch stays on the server.

The wordmark is set type with Archivo's width axis driven by the brand name's
length. It links to `/`.

Navigation lists root categories only. A root category with children shows them in
a submenu, and **both the parent and each child link to the listing filtered by
their own slug** — the parent's link does not promise the union of its children,
because the API cannot serve that.

The header becomes sticky after the first scroll, at which point it gains a
hairline in `--color-wash`. It does not animate in.

### Cart count

`CartButton` renders an empty state during server rendering and fills in after
hydration, because `localStorage` does not exist on the server. It renders the
count in a fixed-width slot so the header does not shift when the number appears.

It shows a **line count**, never a total.
[ADR 0002](../decisions/0002-the-cart-is-browser-state.md) and
[ADR 0003](../decisions/0003-money-is-a-decimal-string-end-to-end.md) both forbid
a money figure here, for different reasons.

### Footer

Plain and short: the wordmark, a link to each root category, a link to the order
lookup, and contact details. The order lookup link matters more than it looks —
for a cash-on-delivery customer it is the only route back to their order
([ADR 0006](../decisions/0006-the-storefront-keeps-its-own-order-record.md)).

### Boundaries

`app/error.tsx` — the generic failure. It shows what happened in the interface's
voice, a way forward, and the request id when one is available. It does not
apologise and it does not say "something went wrong".

`app/not-found.tsx` — for `notFound()` from a product route and for any unmatched
URL. It offers the listing rather than only the home page, because someone who hit
a dead product link is shopping.

`app/loading.tsx` — the shell with the content area skeletonised. Catalogue routes
are cached and rarely reach it; the checkout and order routes always do.

---

## Implemented

**Restyled on 2026-09-24 to the mockup**
([ADR 0008](../decisions/0008-the-storefront-follows-the-supplied-home-design.md)).
The earlier bullets below still describe the structure. What changed:

- **The header hides on the way down and returns on the way up.**
  - `HeaderFrame` (client, Motion) wraps the server-rendered contents.
  - The direction rule is `isHeaderHidden` in `header-scroll.ts`: always shown
    within the header's height of the top, and scroll movement under 6px is
    ignored as jitter.
  - Focus inside the header brings it back.
  - Once scrolled, a hairline appears as a shadow, not a border, so the height
    stays 90px from `md`. The home hero depends on that height.
- **Layout, left to right:**
  - a menu icon, which is the `MobileNav` dialog trigger at every width
  - Home, Collections and New (`site-links.ts`)
  - the centred `LogoMark`, with the brand name `sr-only`
  - an inert heart, the cart, and an inert account disc
- **The header no longer lists categories.** They live in the menu dialog, and
  on the home page under the header.
- **`CartButton` opens the bag as a sheet** on a plain click, and stays a link
  to `/cart` otherwise (see `cart.md`).
- **`CartButton` is a "Cart" pill plus a ringed disc.** The disc shows the unit
  count when there is one and a bag glyph otherwise. Its accessible name is
  "Cart, N items", so the e2e suite now finds `/Cart/`.
- **The footer is the mockup's band**, set in Inter:
  - Info (pricing, about, contacts) and Languages (ENG, ESP, SVE) are inert
    text.
  - Technologies sets the brand name large between "VR" and "QR".
  - The bottom row is © year and brand, "Find an order", and privacy.
  - **"Find an order" is not in the mockup and is kept on purpose.** It is the
    route back to an order without the email.
- **Alignment:** the header and footer gutters are 50px from `md`. Pages with
  their own 32px container sit 18px inside that line.

- `app/layout.tsx` — `metadataBase`, the `%s — brand` title template, a
  `same-origin` referrer policy, the skip link, and the header/main/footer shell
- `components/layout/Header.tsx` — a server component; `navigationCategories()`
  is exported so its degradation path can be tested
- `components/layout/Wordmark.tsx` — shared by the header, the footer and the
  holding page
- `components/layout/CartButton.tsx` — renders an empty fixed-width slot until
  hydration, then the unit count, with the count in its accessible name and a
  polite live region
- `components/layout/MobileNav.tsx` — a `Dialog`, receiving categories as props
- `components/layout/Footer.tsx` — including the order-lookup link, which for a
  cash-on-delivery customer is the only route back to their order
- `app/error.tsx`, `app/not-found.tsx`, `app/loading.tsx`
- `app/page.tsx` — a deliberate holding page; `storefront-home` (#9) owns the
  real one
- `next.config.ts` — `images.remotePatterns` for Cloudinary and for the local API
- `Header.test.tsx` and `CartButton.test.tsx`

---

## Remaining

One thing is deliberately deferred:

- **The category submenu behaviour on desktop is unresolved.** A hover menu, a
  click menu and a flat list are all defensible, and the right answer depends on
  how many categories the merchant creates — which nobody knows yet, because the
  catalogue is empty. Ship the flat list of root categories first.

---

## Decisions

### Decision: the header is a server component with two client islands

**Decision**

`Header` renders on the server. `CartButton` and `MobileNav` are the only
`"use client"` boundaries in the shell.

**Reason**

The header is on every page, so marking it client would make every page's shell
client-rendered, ship the category data twice, and delay the wordmark behind
hydration.

**Consequence**

The cart count is empty for the first paint. That is visible and is the cost; a
fixed-width slot keeps it from being a layout shift as well.

### Decision: a parent category link filters by the parent only

**Decision**

Navigation links a category to `/products?category=<its own slug>`, for parents and
children alike.

**Reason**

The API's `?category=` does not descend. A parent link that implied "everything
under here" would return only the products attached directly to the parent, which
for a well-organised catalogue is often none.

**Consequence**

A merchant who files every product under a child category will find the parent's
link shows an empty listing. This is a real trap, it is the backend's documented
behaviour rather than a bug here, and the empty state has to be good enough to
absorb it.

### Decision: the cart's storage layer shipped with this feature, not with #6

**Decision**

`lib/cart/storage.ts` and `lib/cart/use-cart.ts` were built here. The reducer,
the drawer and the cart page stay in `cart` (#6).

**Reason**

The header shows a line count, which means the shell genuinely needs to read the
cart. Stubbing the count to zero until #6 would have meant shipping a header
whose most stateful part was untested and known wrong.

**Consequence**

`cart.md` records the same split. #6 expands `use-cart.ts` from a count hook into
the full context rather than creating it, and its storage tests already exist.

### Decision: the shell never shows a money figure

**Decision**

The header shows a line count. No subtotal, anywhere in the shell.

**Reason**

The storefront performs no arithmetic on money
([ADR 0003](../decisions/0003-money-is-a-decimal-string-end-to-end.md)) and the
cart's prices are knowingly stale
([ADR 0002](../decisions/0002-the-cart-is-browser-state.md)). A running total in
the header would be both computed and wrong.

**Consequence**

The header is less informative than a customer might expect, and this is the first
place someone will try to add a subtotal.

---

## Gotchas

- **`GET /api/v1/categories/` returns a bare array.** Code written against the
  product list's `{count, results}` envelope reads `undefined` and renders an empty
  menu with no error.
- **The cart count must not render on the server.** A count during SSR is a
  hydration mismatch, and React discards the server's markup for the whole subtree
  — which here is the header.
- **Category nesting is one level and the API enforces nothing.** A merchant can
  build a deeper tree through the Django shell; the menu must not assume depth.
- The category fetch is on the `catalog` throttle scope at one call per hour, and
  it is in ADR 0001's budget. It is cheap, but it is on every page's critical path
  when the cache is cold.
- **`metadataBase` must be set** or every Open Graph image resolves relative to
  `localhost` in production, silently.
- The wordmark's length is unknown, so the header must be checked against a
  four-character name and a three-word one before it is called done.
- `app/error.tsx` is a client component by requirement of the framework. It must
  not read `localStorage` during its first render for the same hydration reason as
  the cart count.
- An error boundary must never render an order's access token, and the order routes
  are inside this shell.

---

## Routes

```text
app/layout.tsx        the shell, every route
app/error.tsx         client component, framework requirement
app/not-found.tsx
app/loading.tsx
```

The shell itself owns no URL.

---

## API

### Calls

```text
GET /api/v1/categories/     server, revalidate 3600
```

### Errors handled

| `code` | Treatment |
| --- | --- |
| any | **The header renders without navigation.** A failed category fetch must not take down every page in the store |

The category fetch is wrapped so that a failure degrades to an empty menu. This is
the one place in the storefront where an `ApiError` is caught and swallowed, and
the reason is that the alternative is a total outage caused by a navigation menu.

---

## State and data

| Tier | Holds |
| --- | --- |
| `localStorage` | Read-only here: the cart line count, from `tl.cart.v1` |
| React state | Mobile menu open/closed; header sticky state |

The shell writes nothing.

---

## Accessibility

- One `<header>`, one `<nav>`, one `<main>`, one `<footer>` per page, with a skip
  link to `<main>` as the first focusable element.
- The mobile navigation is a `Dialog`: focus is trapped while open, restored to the
  trigger on close, Escape dismisses, and the background does not scroll.
- The cart button's accessible name includes the count — "Bag, 2 items" — because
  a number alone announces as a number.
- The cart count updates through a polite live region, so adding an item from a
  product page is announced rather than only seen.
- The current category is marked `aria-current="page"`, not merely styled.
- The sticky header must not cover the focused element when tabbing; scroll padding
  accounts for its height.

---

## Tests

- `components/layout/CartButton.test.tsx` — renders empty before hydration, fills
  in after, and announces the count
- `components/layout/Header.test.tsx` — a category with children renders both
  levels, and each link filters by its own slug
- `components/layout/MobileNav.test.tsx` — focus trap, Escape, restore
- A test that the header renders with navigation absent when the category fetch
  fails, since that path is the one nobody exercises by hand

---

## Files

```text
app/layout.tsx
app/error.tsx
app/not-found.tsx
app/loading.tsx
components/layout/Header.tsx
components/layout/CartButton.tsx
components/layout/MobileNav.tsx
components/layout/Footer.tsx
lib/api/catalog.ts            listCategories
```

---

## Future context

The header is the only component on every route, so its cost is paid everywhere.
Keep the client islands small and resist the pull to make the whole thing
interactive — a search box that opens, a mega menu, an announcement bar with a
dismiss button each look small and each move the boundary up.

The parent-category trap is the thing most likely to produce a confusing bug report
from the merchant: they will file products under children, click the parent, and
see nothing. The fix is either in the backend (`Q(category__parent__slug=...)`,
which its own docs describe) or in the navigation design, and it should be raised
before it is discovered.
