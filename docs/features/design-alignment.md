# Design alignment

Status: Implemented

Last updated: 2026-09-26

---

## Goal

Restyle the storefront to follow the supplied mockups in `docs/design/`, with TrueLux
branding in place of the template's "CEIN." wordmark, and add skin-type support.
[ADR 0011](../decisions/0011-the-storefront-follows-the-supplied-design.md).

---

## Scope

What is included in this implementation?

The mockups, as PNG slices in `docs/design/renders/`:

- `Landing-desktop-1..5.png`
- `Product-Listing---desktop-1..3.png`
- `Product-detail---desktop-1..3.png`
- `Product-detail---mobile-img0-275x4096.png`
- `Menu dropdown- desktop.png`
- `Menu---mobile-img0-375x812.png`
- `Sub Menu - mobile.png`

Implemented against them:

- **Visual language:** the tokens, type and component shapes in
  [design-system.md](design-system.md).
- **Announcement bar, header, mega-menu, mobile drill-down, search, footer:**
  [site-shell.md](site-shell.md).
- **Landing:** [storefront-home.md](storefront-home.md).
- **Product listing, with the Skin type filter:** [catalog-browsing.md](catalog-browsing.md).
- **Product detail, with Suited to / Skin feel / Key ingredients, the routine and
  related products:** [product-detail.md](product-detail.md).
- **Bag, checkout, orders and brands** restyled to the same language through
  `PageShell` and the tailored primitives; behaviour unchanged.

What is explicitly outside the scope?

- Wishlist ("Save to cabinet", heart icons), accounts ("Log in"), language
  switching, Click and Collect, stores, customer support, newsletter and social
  links, and reviews: none exists, and ADR 0011 leaves them out rather than faking
  them.
- The mockups' embedded photographs (the `-imgN` files): template assets carrying
  another brand's logo.

---

## Context

The backend additions are specified in `../back-end/docs/features/skin-types.md`
and were implemented in parallel: `GET /skin-types/`, the repeatable `?skin_type=`,
`?category=<root>` including its children, and `skin_types`, `skin_feel` and
`key_ingredients` on product detail. The storefront is coded against that document
and transcribed in [backend-api.md](../integrations/backend-api.md).

---

## Planned

Nothing outstanding; see Remaining.

---

## Implemented

Page by page, with where it matches the render and where it deliberately does not.

### Theme and primitives

Near-white `#fdfdfb` ground, charcoal `#333` text and primary, greige `#f3f2ee` and
stone `#e8e6dd` bands, `#333` ink for the announcement bar and footer. Noto Sans for
the interface (the mockup's UI face) and Belleza for section titles (closest Google
match to the mockup's flared humanist). Square buttons, inputs and toggles; the
outlined 64px "Discover more" with the arrow at the far end; an on-image variant;
plus/minus accordions; a dot breadcrumb separator; carousel dots and a progress
rule. All inside `components/ui/*` and `app/globals.css`.

### Shell

- Announcement bar: the dark strip, carrying the shipping copy from `GET /shipping/` (checkout-quote.md).
- Header (80px, charcoal bottom rule): Shop, Brands, Journal, About on the left;
  the wordmark centred; search and the bag with its count on the right. Matches
  `Landing-desktop-1.png` and `Menu dropdown- desktop.png` in height, spacing and
  alignment.
- Mega-menu: full width under the header, a bar under the open trigger, columns
  from `/categories/` (each "Shop all" then children) with **Skin type** after the
  first root, and an image in the right 27%. Matches `Menu dropdown- desktop.png`;
  with the seeded tree's five roots it wraps to a second row of columns.
- Mobile menu: full-screen sheet of 56px ruled rows with chevrons, drilling into
  Shop › column › links with a back row, per `Menu---mobile` and `Sub Menu - mobile`.
- Footer: the dark block with the wordmark and columns; an accordion on phones as in
  the mobile render.

### Landing

In the render's order: hero carousel (eyebrow, title, copy, outlined Discover more,
line indicators), image/text editorial, New arrivals rail, dark image band,
the first root category's rail, the stone quote band (as About, with the three
promises), the brands grid (in the "User Voice" slot), and the journal row with its
progress rule. Positions and spacing at 1400px were checked slice by slice against
`Landing-desktop-1..5.png`.

### Product listing

Hero band with the category's title and a line of copy, the greige category band
("Shop all |" then the children, the applied one underlined), then the Filter and
sort panel (Skin type, Brand, Shade, Size, Price, Availability, Sort), the product
count, and a four-column grid of centred cards (image tile, name, brand, price).
Matches `Product-Listing---desktop-1.png` for the hero and band heights and the
grid; filters remain links (ADR 0004).

### Product detail

A full-bleed gallery (69%) beside a panel: category breadcrumb (root • category),
title, brand, description, price, pickers, a full-width dark Add to bag, and the
ruled Suited to / Skin feel / Key ingredients rows, each hidden when empty. Then
the Skin routine band (static Cleanse + Treat + Protect), the stone accordion band
with an image, and the "Combine with" rail from the same category. Matches
`Product-detail---desktop-1..3.png` and, at 375px, the mobile render's order.

### Secondary pages

Bag, checkout, confirmation, order status, order lookup, brands, not found and the
error boundary use `PageShell` (page width, Belleza title) and the tailored
controls. The bag line no longer overflows at 375px.

### Deviations from the mockups

| Where | Mockup | Implementation | Why |
| --- | --- | --- | --- |
| Everywhere | Photographs | Generated SVG placeholders in `public/art/` | The photos are another brand's assets |
| Header | Language, wishlist, account icons | Left out | No such features (ADR 0011) |
| Header, mobile | Search beside the menu icon | Search beside the bag | One search control serves both widths |
| Hero, listing band | White text directly on pale images | A left-to-right scrim under the text | The mockup's pairing is well under 3:1 contrast |
| Hero | Body-care copy | TrueLux copy linking to the shop, new arrivals and brands | No such campaign data exists |
| Editorial | "Skin Care / Potent Solutions" | "Shop by skin type", linking to the first root category | Honest copy for TrueLux |
| Rails | "Parsley Seed", "Pure Radiance" product lines | New arrivals; the first root category | No product lines in the API |
| Product cards | Description, size, "Bestseller", heart, hover "Add to your cart" | Name, brand, price, "Sold out" label; no hover add | The list item has no description, size or variant id; no wishlist; no bestseller flag |
| Rails | Progress rule only | Progress rule plus previous/next buttons | A mouse user needs a way to move the rail |
| Quote band | Quote only | Statement, "About TrueLux" and the three promises | It is the About link's destination |
| User Voice | Instagram grid | Our brands grid | No customer content exists |
| Journal | Articles with "Read more", "All blog posts" | Four short notes ending in a search link | No articles or article routes exist |
| Mega-menu | Four columns | One per root plus Skin type, wrapping | The seeded tree has five roots |
| Listing | "Revered formulations" heading above the grid | Product count and the Filter and sort panel | No per-category copy in the API; the filters need a place |
| Listing | No filters shown | A Filter and sort dropdown panel, the width of the grid | The requirement adds filters; the design has no rail |
| Product detail | "Save to cabinet" | Left out | No wishlist |
| Product detail | Benefits / How to use / Ingredients accordion | Delivery / Payment / Authenticity | No benefits or usage fields; ingredients are already a row |
| Product detail | Reviews | Left out | No reviews |
| Product detail | Thumbnail strip absent | Thumbnails under the gallery | Products have several photographs |
| Footer | Newsletter, social icons, guides and service links | Shop, Categories and Orders columns | No newsletter, social accounts or those pages |

---

## Remaining

- Real photography (every `public/art/` file).
- The Playwright mega-menu case fails against the live API: after the first
  navigation, the second "Shop all" click is intercepted by the menu's viewport
  wrapper. The same journey passes by hand; the spec or the menu needs a look.

---

## Decisions

### Decision: the facets sit in a dropdown panel

**Decision**

Categories live in the always-visible band; the other facets sit in a dropdown
panel (a `Popover`) the width of the grid, closed on arrival.

**Reason**

The design has no filter rail, and the requirement adds a Skin type filter.

**Consequence**

Opening the panel needs JavaScript; see catalog-browsing.md.

### Decision: the listing revalidates every ten minutes

**Decision**

`LIST_REVALIDATE` went from 300 to 600 seconds.

**Reason**

The mega-menu and category band make every category and skin type a hot listing
key: 42 keys, and the worst case at 300 seconds was 751 calls an hour against a
600 ceiling. See architecture.md.

**Consequence**

A newly published product can take up to ten minutes to appear.

---

## Gotchas

- The mockup's section font is not on Google Fonts; Belleza is the stand-in.
- The mockup PNGs are 1400 (desktop) and 275 (mobile product) pixels wide; the
  mobile render is scaled from a 375px design.
- `docs/design/renders/` is gitignored, including `impl/` where the comparison
  screenshots are written.

---

## Routes

No new routes. `/#journal` and `/#about` are anchors on the home page.

---

## API

### Calls

```text
GET /api/v1/skin-types/                          server, revalidate 3600 (header, facets)
GET /api/v1/products/?skin_type=…                server, revalidate 600
GET /api/v1/products/?category=<root>&limit=8    server, revalidate 600 (home rail)
GET /api/v1/products/?category=<slug>&limit=9    server, revalidate 3600 (related)
```

### Errors handled

| `code` | Treatment |
| --- | --- |
| `validation_error` for an unknown `?skin_type=` | The listing's "nothing matches these filters" state |
| any, on `/skin-types/` | No Skin type column or filter group |
| any, on a rail | No rail |

---

## State and data

`skin_type` joins the URL state (repeated, sorted, at most ten). No new client state
beyond the menu panel and the filter panel's open state.

---

## Accessibility

- Contrast was measured for every token pair; see design-system.md.
- Text over imagery sits on a scrim.
- Mega-menu columns and filter groups are named regions; the mobile sub-menu moves
  focus to its back row.
- Carousels name their regions distinctly from their sections, and their dots are
  44px buttons with `aria-current`.
- 44px targets are kept on controls; the square restyle changed shape, not size.

---

## Tests

- `lib/catalog/query.test.ts` — skin-type parsing, dedupe, cap, canonical order,
  toggling; `appliedFilterCount`.
- `lib/catalog/navigation.test.ts` — `shopMenu` from categories and skin types;
  `findCategory`; the skin-type facet.
- `components/catalog/ProductDetails.test.tsx` — rows hidden when empty.
- `components/catalog/FilterPanel.test.tsx`, `components/catalog/CategoryBand.test.tsx`.
- `lib/api/catalog.test.ts`, `lib/catalog/rails.test.ts`, `app/page.test.tsx`.
- `tests/e2e/buy-flow.spec.ts` — filtering by skin type, the mega-menu, and an
  applied filter keeping its inverted text on hover. Against the live API with
  `seed_demo`, eight of nine pass; the mega-menu case fails (see Remaining).

Verified against the live, seeded backend at 1400px and 390px: home → mega-menu →
category → skin-type filter → product → shade → bag → cash-on-delivery checkout →
confirmation → order lookup, with no console or HTTP errors, and 72 internal links
crawled with none dead.

Visual verification: Playwright screenshots at 1400px and 375px compared with the
renders; the final set is in `docs/design/renders/impl/`.

---

## Files

```text
app/globals.css
app/layout.tsx
components/ui/
components/layout/
components/home/
components/catalog/
lib/api/{types,catalog}.ts
lib/catalog/{query,navigation,rails}.ts
public/art/
```

---

## Future context

When photography arrives, the hero and listing scrims can be tuned per image, and
the `-imgN` renders show the crops the design expects.
