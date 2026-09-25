# Storefront home

Status: In progress

Last updated: 2026-09-24

---

## Goal

Give someone arriving from an Instagram link a reason to keep scrolling, and a
short path into the catalogue.

---

## Scope

What is included in this implementation?

- `/` — the home page
- The mockup's sections: categories and search, the hero rail, "New this week",
  "Collections", and "Our approach"
- A category entry point
- The state where the catalogue is empty

What is explicitly outside the scope?

- The listing and its filters, which belong to `catalog-browsing.md`
- The shell, which belongs to `site-shell.md`
- Editorial content the API cannot supply: collections, lookbooks, campaign copy,
  a journal. There is no CMS
- Newsletter signup, a countdown, a promo bar — none has a backing service

---

## Context

This is the first page a customer sees, and almost all of them arrive from a link
in an Instagram bio on a phone, on a mobile connection, having never heard of the
website.

The API gives this page very little to work with. There is no "featured" flag, no
collection model, no campaign copy, no hero image field, and no CMS. Everything on
this page is either a product from
`GET /api/v1/products/`, a category from `GET /api/v1/categories/`, or a string in
the repository.

That constraint decides the design. The page cannot be merchandised from an admin,
so it must look deliberate using only ordering the merchant already controls.
`?ordering=-created_at` is the one editorial lever available: the newest garments
are the drop.

`design-system.md` places the one bold gesture in the storefront here — the
wordmark set large and clipped by the viewport edge — and requires everything else
to stay quiet.

---

## Planned

The page follows the mockup at `docs/design/Home.svg` (1280 wide), per
[ADR 0008](../decisions/0008-the-storefront-follows-the-supplied-home-design.md).
It replaces the earlier plan of a full-bleed hero, a clipped wordmark, an
asymmetric grid and a motion moment.

```text
header (site shell)
TOPS / BOTTOMS               root categories, links
[ Search            ]        GET /products?search=
NEW          ┌────────┐ ┌────────┐
COLLECTION   │ slide  │ │ slide  │ ›     hero rail, placeholder images
Summer 2024  └────────┘ └────────┘
[Go To Shop →] ‹ ›
NEW THIS WEEK(6)                    See All
┌──────┐ ┌──────┐ ┌──────┐ ┌───        rail, the six newest, bleeds right
‹ ›
BRAND / COLLECTIONS / 23-24
(ALL) Tops Bottoms     Filters(+)  Sorts(-) Less to more / More to Less
┌────────┐ ┌────────┐ ┌────────┐       three-column grid
More ⌄
OUR APPROACH TO FASHION DESIGN
four staggered plates, the last running off the right edge
footer (site shell)
```

---

## Implemented

Everything above is built, against **placeholder images**.

- **`app/page.tsx`:** one `latestProducts()` call (nine newest) plus
  `navigationCategories()`.
  - `NewThisWeek` gets the first six.
  - `Collections` gets the last three, so a full catalogue shows nothing twice.
  - An empty or failed catalogue replaces both sections with "The shop is not
    open yet".
  - The page wrapper is `overflow-x-clip`, because the rail and the last plate
    run off the right edge by design.
- **`Intro`:** root categories as uppercase links, and a search form
  (`action="/products"`, `name="search"`, a real `<label>`) that works without
  JavaScript.
- **`Hero`:**
  - An `<h1>` reading "New collection" and the design's "Summer 2024".
  - "Go To Shop" links to `/products`.
  - A scroll-snapping `<ul id="hero-rail">` of four placeholder slides in 1px
    frames at 365:375. It has `tabIndex={0}`, because nothing inside it is
    focusable.
- **`NewThisWeek`:**
  - The heading's indigo "(N)" is the number of tiles shown. The API has no
    "this week" count.
  - "See All" links to `/products?ordering=-created_at`.
  - The rail bleeds into the right gutter.
- **`Collections`:**
  - The headline is brand, "Collections", "23-24".
  - The tabs are links: "(All)" to `/products`, each root category to its filter.
  - "Filters(+)" links to `/products`.
  - The price sorts go to `ordering=base_price` and `ordering=-base_price`,
    with "Price, " in `sr-only`.
  - "More" links to `/products`.
- **`Approach`:** the mockup's copy, with the brand name replacing "elegant
  vogue" and its typos fixed, and four staggered placeholder plates.
- **Second pass:**
  - **Viewport fit:** from `lg`, the intro and hero fill `100svh − 90px`, with
    a 34rem floor and the hero pinned to the bottom.
    - Slides are sized with container units: as large as fits both half the
      rail and its full height.
    - The hero is capped at the height two full-width slides would have, so
      the headline starts level with the images' top edge. At 1280×800 it
      spans 385–760px, against the design's 386–762.
    - The text column is 34.5% of the width, the design's 407 of 1180, so
      tablets in landscape keep usable images.
  - **"New this week"** tiles are exactly the collection grid's width, with
    the same 42px gap.
  - **Motion:**
    - On load, the headline lines rise, the slides unveil with their images
      settling, and the intro and controls fade in. These are CSS, staggered.
    - Section headlines rise on first scroll into view (`RevealLines`).
    - The approach plates drift at four rates (`ApproachPlates`).
    - On hover:
      - tiles zoom slowly
      - the arrow and chevron nudge
      - nav links draw an underline
- **`RailControls` was the page's first client code.** Its previous and next
  buttons scroll a list by id, one tile plus the gap at a time, and disable at
  either end. The lists themselves are server markup that scrolls without
  JavaScript. The design puts the buttons away from the list, beside "Go To
  Shop" in the hero, which is why they target the list by id.
- **Placeholders:** `public/home/placeholder-{1..4}.svg`, neutral tonal figures
  with `alt=""`. Swapping one in is a file and an `alt` describing the garment.

---

## Remaining

Blocked on the merchant:

- **Real photography** for the four hero slides and the four approach plates,
  each with a real `alt`.
- **Real copy.** "Summer 2024", "Collections 23-24" and the approach paragraph
  are the mockup's placeholder text.

Deliberately not built:

- **The colour swatches with "+N" on tiles.** The list payload has no variants,
  so any swatch would be invented (ADR 0008).

Not yet checked:

- Instagram's in-app browser.

---

## Decisions

### Decision: the home page is merchandised by ordering, not by a flag

**Decision**

`?ordering=-created_at`, limit 9. There is no featured list.

**Reason**

The API has no featured flag and no collection model.

**Consequence**

The merchant curates by publication order. `-created_at` sorts by creation, not
publication.

### Decision: hero and approach images are repository assets

**Decision**

They live in `public/home/` and change with a deploy.

**Reason**

The API has no hero image field and there is no CMS.

**Consequence**

The merchant cannot change the most prominent images on the site themselves.

### Decision: tabs and sorts are links to the listing, not home-page state

**Decision**

Every filter-like control in "Collections" navigates to `/products`.

**Reason**

The listing already normalises these parameters and owns their cache keys
(ADR 0001, ADR 0004). Filtering on the home page would make it a second listing
with its own set of keys.

**Consequence**

"(All)" is always the styled-active tab on the home page, because the home grid
is never filtered.

---

## Gotchas

- **The catalogue can be empty**, and on a fresh backend it will be.
- **`primary_image` can be `null`** on any tile. The framed `--wash` block
  holds the shape.
- **A constant exported from a "use client" file reaches a server component as
  a reference, not a value.** That is why `SITE_LINKS` lives in a plain module.
- **The rail's snapping and the arrows' step both assume equal-width tiles.**
- **The home page is the second place that swallows an `ApiError`**, after
  `navigationCategories`, and only API failures.
- **`ProductCard`'s default `sizes` is for the listing.** The rail passes
  `304px` and the grid `29vw`.
- **At 1280 the design's gutters are 50px.** The header, footer and home page
  use 50px from `md`; other pages keep 32px.

---

## Routes

```text
/     server-rendered, revalidate 300, indexed
```

---

## API

### Calls

```text
GET /api/v1/products/?ordering=-created_at&limit=9     server, revalidate 300
```

Categories come from `navigationCategories()`, the same deduplicated fetch the
header makes, so the page adds no upstream request for them.

### Errors handled

| `code` | Treatment |
| --- | --- |
| any `ApiError` or `ApiUnreachableError` | Intro, hero and approach render; both product sections become the not-open-yet copy |

---

## State and data

```text
RailControls: which end of its list is reached (React state). Nothing else.
```

---

## Accessibility

- **Headings:** there is one `<h1>` ("New collection"), and each section is a
  region named by its `<h2>`.
- **Search:** the input has a visible placeholder and a `sr-only` label, and
  sits in a `role="search"` form.
- **Arrows:** they are `<button>`s with "Previous" and "Next" names and
  `aria-controls`. At an end they are `disabled`, not merely dimmed.
- **Inert controls** are `aria-hidden` shapes, never focusable (ADR 0008).
- **The hero rail** is keyboard-scrollable through `tabIndex={0}` and an
  `aria-label`.
- **Contrast:** secondary greys are raised to `--slate` and `--mute`, which pass
  AA on the page.

---

## Tests

- `app/page.test.tsx`:
  - the six newest go to the rail and the last three to the grid, with "(6)"
  - an empty catalogue keeps the `h1` and says not open
  - a failed fetch (`throttled`) renders the same
  - the category links filter by slug
  - search is a GET form to `/products`
  - the price sorts use `base_price`
- `components/home/RevealLines.test.tsx`:
  - the accessible name keeps the lines' words apart
  - a headline already on screen is never hidden
  - a headline below the fold waits on an observer
- `components/layout/header-scroll.test.ts`:
  - hides moving down, returns moving up
  - always shows near the top
  - ignores jitter
- `components/home/RailControls.test.tsx`:
  - previous is disabled at the start
  - next steps one tile plus the gap
  - next is disabled at the end
  - both are disabled when everything fits
- `lib/catalog/latest.test.ts`: the query (limit 9), and degradation on API
  errors only.

---

## Files

```text
app/page.tsx, app/page.test.tsx
components/home/Intro.tsx
components/home/Hero.tsx
components/home/NewThisWeek.tsx
components/home/Collections.tsx
components/home/Approach.tsx
components/home/RailControls.tsx, RailControls.test.tsx
components/home/RevealLines.tsx, RevealLines.test.tsx
components/home/ApproachPlates.tsx
components/layout/HeaderFrame.tsx, header-scroll.ts, header-scroll.test.ts
public/grain.jpg
components/ui/Chevron.tsx
components/catalog/ProductCard.tsx      sizes prop, the mockup's tile
lib/catalog/latest.ts, latest.test.ts
public/home/placeholder-{1..4}.svg      to be replaced
docs/design/Home.svg                    the mockup
```

---

## Future context

This page is the strongest argument in the project for a small amount of
merchandising in the backend: a featured flag, a hero image, and one line of
campaign copy would each remove a compromise recorded above. None is worth
building client-side, and all three are cheap on the other side.

Until the photography exists, this page cannot be finished. Building the layout
against placeholders is fine; calling it done is not, because the whole direction
rests on one photograph at one crop.
