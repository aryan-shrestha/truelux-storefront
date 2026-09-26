# Design alignment

Status: Planned

Last updated: 2026-09-26

---

## Goal

Restyle the storefront to follow the supplied mockups in `docs/design/`, with TrueLux
branding in place of the template's "CEIN." wordmark.
[ADR 0011](../decisions/0011-the-storefront-follows-the-supplied-design.md).

---

## Scope

What is included in this implementation?

The mockups are rendered as PNG slices in `docs/design/renders/`:

- `Landing-desktop-1..5.png`
- `Product-Listing---desktop-1..3.png`
- `Product-detail---desktop-1..3.png`
- `Product-detail---mobile-img0-275x4096.png`
- `Menu dropdown- desktop.png`
- `Menu---mobile-img0-375x812.png`
- `Sub Menu - mobile.png`

Match their layout, spacing, typography, palette and component shapes:

- **Visual language:** a near-white background, charcoal text and primary buttons,
  a warm greige/stone band background, square or very small radii, thin rules, and a
  light humanist sans for UI and headings, with an elegant serif for section titles
  where the mockup uses one. Everything is re-expressed as shadcn theme variables and
  `next/font`. This supersedes the rose-nude palette of ADR 0010.
- **Announcement bar:** a dark strip above the header. Its copy comes from the
  existing `NEXT_PUBLIC_SHIPPING_NOTE`. Do not invent offers.
- **Header:**
  - Left: Shop (opens the mega-menu), Brands, Journal-style link to the home
    editorial section, and About.
  - Centre: the TrueLux wordmark.
  - Right: search (opens a shadcn `command` or `sheet` search that navigates to
    `/products?search=`) and the bag with a count.
  - Leave out the design's language switcher, wishlist and account icons (no
    accounts or wishlist exist).
- **Desktop mega-menu** (`navigation-menu`), per `Menu dropdown- desktop.png`:
  - One column per root category from `/categories/`, headed by the category name,
    with "Shop All" (`?category=<root>`) followed by its children.
  - Plus a **Skin Type** column from `/skin-types/`.
  - A single editorial image on the right.
- **Mobile menu** (`sheet`, drill-down sub-menus), per the two mobile menu images.
- **Landing:** a full-bleed hero carousel with an eyebrow, title, copy and outlined
  "Discover more" button, then the alternating image/text editorial sections,
  product rails and the remaining sections exactly as the mockup orders them. Map each
  section to real data (new arrivals, a category, a brand) or to static editorial
  copy for TrueLux.
- **Product listing:** follow `Product-Listing---desktop-*.png` for the header band,
  filter placement, grid density, card anatomy (image on a tinted tile, brand, name,
  price) and pagination. Filters stay links (ADR 0004) and include Skin type.
- **Product detail:**
  - Follow `Product-detail---desktop-*.png` and the mobile render: a large image on
    the left (gallery), and a right panel with the category breadcrumb, title,
    description, price, shade/size pickers and a full-width dark "Add to bag"
    button.
  - Then ruled rows for **Suited to** (`skin_types`), **Skin feel** and **Key
    ingredients**, each hidden when empty.
  - Then the lower sections in the mockup. The "Skin routine" steps become static
    copy, and the related products come from the same category.
- **Footer:** as in the mockup, minus the newsletter signup (there is no backend for
  it; leave it out rather than faking it).
- Cart, checkout and order pages restyled to the same language. Their behaviour is
  unchanged.

What is explicitly outside the scope?

- Wishlist ("Save to cabinet"), accounts, language switching, Click and Collect,
  store locator and newsletter
- Using the mockups' embedded photographs as site imagery. They are template assets
  with another brand's logo. Imagery stays generated placeholders, tinted to the new
  palette.

---

## Context

Backend additions this depends on are in `../back-end/docs/features/skin-types.md`:
`/skin-types/`, `?skin_type=`, `?category=<parent>` including its children, and
`skin_types`, `skin_feel` and `key_ingredients` on product detail. They are being
implemented in parallel.

---

## Planned

- Everything stays shadcn (ADR 0009). Restyle inside `components/ui/*` and the theme
  variables.
- Compare each page against its render at 1400px and 375px widths with Playwright
  screenshots before calling it done.
