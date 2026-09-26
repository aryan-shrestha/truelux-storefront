# Storefront home

Status: Implemented

Last updated: 2026-09-26

---

## Goal

A home page that says what TrueLux is (authentic cosmetics, delivered across
Nepal, paid in cash on arrival) and leads into the catalogue, laid out as
`Landing-desktop-1..5.png` ([design-alignment.md](design-alignment.md)).

---

## Scope

What is included in this implementation?

In the mockup's order:

1. A full-bleed hero carousel: three slides, each with an eyebrow, title, copy and
   an outlined "Discover more"
2. The image and text editorial, about shopping by skin type
3. New arrivals, a product rail
4. A full-bleed dark image band about authenticity
5. The first root category's rail
6. The About band (the mockup's quote band), with the three promises
7. Our brands (in the place of the mockup's "User Voice" grid)
8. Our journal: four static notes

What is explicitly outside the scope?

- Merchant-editable content, a featured flag, bestseller labels: the API has none
- Instagram content and real journal articles: neither exists
- The mockups' photographs

---

## Context

The API has no home-page content. Creation order is the only editorial lever
(`ordering=-created_at`). Categories and brands come from the same reads the header
and the filter panel make.

---

## Implemented

- `app/page.tsx` — reads `latestProducts()`, `navigationCategories()` and
  `navigationBrands()` in parallel, then streams the category rail in its own
  `Suspense` once the first root is known.
- `components/home/Hero.tsx` — shadcn `Carousel` (looping, no autoplay) with
  `CarouselDots`; the first slide's title is the page's `h1`. Slides link to
  `/products`, new arrivals and `/brands`. A left-to-right scrim keeps the white
  text legible on any image.
- `components/home/Editorial.tsx` — `public/art/editorial.svg` in the left 45%, the
  copy and an outlined "Discover more" to the first root category (or `/products`).
- `components/catalog/ProductRail.tsx` — a section heading, a `Carousel` of product
  cards (two, three, then four across), a `CarouselProgress` rule, and a link to the
  full list with previous/next buttons. Renders nothing for an empty list.
- `components/home/ImageBand.tsx` — `public/art/band.svg`, dark enough for white
  text without a scrim; links to `/brands`.
- `components/home/CategoryRail.tsx` — "The {root} shelf": `categoryProducts()` of
  the first root, which includes its children.
- `components/home/About.tsx` — `id="about"`, a stone band with a Belleza statement,
  "About {brand}", and the three promises from `components/layout/promises.ts`.
- `components/home/BrandGrid.tsx` — up to six brands as square tiles (logo, or the
  name in Belleza, and the product count) on the greige band, then "All brands".
- `components/home/Journal.tsx` — `id="journal"`, four static notes in a carousel,
  each ending in a search link rather than a "Read more" to nowhere.
- `lib/catalog/rails.ts` — `latestProducts()`, `categoryProducts()` and
  `relatedProducts()`, each degrading to `[]` on an API failure.
- `public/art/*.svg` — generated placeholder art in the new palette, replacing
  `public/home/`.

---

## Remaining

- Real photography for the hero, the editorial, the band, the menu and the journal.
- Journal notes are static; real articles need a content source.

---

## Decisions

### Decision: the home page never fails because the catalogue did

**Decision**

Every read on this page degrades to empty, and each section hides when it has
nothing.

**Reason**

Every link to the shop points here, and a throttled API must not take it down.

**Consequence**

A fresh deployment shows the hero, the editorial, the authenticity band, the About
band and the journal.

### Decision: product rails are carousels (reverses "new arrivals are a grid")

**Decision**

New arrivals, the category shelf and the product page's related products are
horizontal carousels with a progress rule, as in the design.

**Reason**

ADR 0011: the storefront follows the supplied design, and every product row in it
is a rail. The earlier grid was chosen because a carousel clips its items without
JavaScript; that is still true.

**Consequence**

Without JavaScript a rail shows its first two to four products, and its "All …"
link leads to the rest.

### Decision: the design's sections are mapped to real data or honest copy

**Decision**

"Parsley Seed Skin Care" becomes new arrivals, "Pure Radiance" the first root
category, "User Voice" our brands, and the journal is four short notes that end in
a search.

**Reason**

The API has no product lines, no customer content and no articles.

**Consequence**

Nothing on the page claims something the shop does not have.

---

## Gotchas

- The About and Journal sections' `id`s are the targets of the header's links.
- Journal links are searches ("spf", "serum", "foundation", "cleans"), which never
  400, unlike a guessed category or skin-type slug.
- The category read is the header's, deduplicated within the render.

---

## Routes

```text
/     static, revalidated every 10 minutes (its shortest fetch); indexed
```

---

## API

### Calls

```text
GET /api/v1/products/?ordering=-created_at&limit=8    server, revalidate 600
GET /api/v1/products/?category=<first root>&limit=8   server, revalidate 600
GET /api/v1/categories/                               server, revalidate 3600
GET /api/v1/brands/                                   server, revalidate 3600
```

### Errors handled

| `code` | Treatment |
| --- | --- |
| any | The section is not rendered |

---

## Tests

- `app/page.test.tsx` — asks for the eight newest and renders them in the New
  arrivals region; the editorial points at the first root; brands link to their
  pages; `#journal` and `#about` exist with the three promises; the hero survives
  every read failing, without rails or brands. `CategoryRail`: asks for the root
  with a limit of eight and links to all of it; renders nothing when empty.
- `lib/catalog/rails.test.ts`.

---

## Files

```text
app/page.tsx
components/home/
components/catalog/ProductRail.tsx
components/layout/promises.ts
lib/catalog/rails.ts
public/art/
```
