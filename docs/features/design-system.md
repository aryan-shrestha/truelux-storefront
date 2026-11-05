# Design system

Status: Implemented

Last updated: 2026-10-14

---

## Goal

Give the storefront one visual identity, expressed as theme tokens and one
component library, so every feature is an application of a decided system rather
than a fresh set of choices.

---

## Scope

What is included in this implementation?

- The direction of [ADR 0011](../decisions/0011-the-storefront-follows-the-supplied-design.md):
  the client's mockups in `docs/design/`, re-expressed as shadcn theme variables,
  with the palette from the client's logo ([ADR 0013](../decisions/0013-the-palette-follows-the-logo.md)).
  A warm ivory ground tinted from the gold, green-black text, a bottle-green primary and ink, honey gold
  only on the green, sage bands, square controls, thin rules
- The token set as shadcn CSS variables in `app/globals.css`, light theme only
- Two typefaces through `next/font`
- The component vocabulary, which is shadcn/ui
  ([ADR 0009](../decisions/0009-shadcn-ui-is-the-component-library.md)); see
  [shadcn-foundation.md](shadcn-foundation.md)

What is explicitly outside the scope?

- Dark mode and a theme toggle. The storefront is light only ([ADR 0012](../decisions/0012-the-storefront-is-light-only.md)).
- Real photography. Imagery is generated SVG placeholder art in `public/art/`; the
  mockups' embedded photographs are another brand's assets and are not used.

---

## Context

ADR 0011 supersedes ADR 0010's rose-nude direction, and ADR 0013 replaces ADR
0011's charcoal and greige palette with the logo's bottle green (`#143532`) and honey
gold (`#ebba65`), measured from `public/truelux-logo.jpg`. The mockups were measured from
the PNG renders in `docs/design/renders/`; see [design-alignment.md](design-alignment.md)
for the page-by-page mapping and deviations.

---

## Implemented

### Colour tokens

Defined once in `app/globals.css` and mapped to Tailwind colours under
`@theme inline`. No component holds a hex value.

| Token | Value | Role |
| --- | --- | --- |
| `--background` | `#faf5e9` warm ivory, tinted from the gold | Page |
| `--foreground` | `#1d2e2b` green-black | Text, the header's bottom rule, the open-menu bar |
| `--card` | `#ffffff` | Cards, the routine steps |
| `--popover` | `#faf5e9` | Sheets, the mega-menu |
| `--primary` | `#143532` bottle green | Primary buttons (Add to bag, Checkout), the header wordmark |
| `--primary-foreground` | `#faf5e9` | Text on primary |
| `--secondary` | `#dde6da` deep sage | The product care panel, the brand tile hover |
| `--muted` | `#ebefe4` leaf sage | The pale bands (category band, brands, routine), image tiles, skeletons |
| `--muted-foreground` | `#4f5f5a` | Secondary text |
| `--accent` | `#ebefe4` | Hover backgrounds |
| `--destructive` | `#a3392f` | Checkout and lookup failures |
| `--border` | `#d4dbcf` | Hairlines, the rail's scrollbar |
| `--input` | `#7a8984` | Control borders and the outlined CTA, 3:1 against the page |
| `--ring` | `#143532` | Focus |
| `--ink`, `--ink-foreground` | `#143532`, `#f5efe2` | The logo's green: the announcement bar, the About band, the footer |
| `--ink-muted` | `#a9bcb5` | Secondary text on ink |
| `--gold` | `#ebba65` | The logo's gold, **only on ink**: the announcement text, the About statement, the footer wordmark |
| `--on-image` | `#ffffff` | Text and outlined buttons over imagery |
| `--scrim` | `rgb(20 53 50 / 0.5)` | The green gradient behind text on the hero and brand images |
| `--chart-1`…`5` | green to sage | Reserved for the admin's charts |

Removed earlier: `--shade-1`…`8` (the hero's shade ribbon). `--gold` returned on
2026-10-14 as the logo's gold, on ink only.

Measured contrast (WCAG): foreground on background 13.1:1, on leaf sage 12.2:1, on
deep sage 11.1:1; muted-foreground on background 6.2:1, on leaf sage 5.8:1, on deep
sage 5.3:1; primary-foreground on primary 12.2:1; ink-foreground on ink 11.6:1;
ink-muted on ink 6.7:1; gold on ink 7.4:1 (and 1.6:1 on the background, which is why
it stays on ink); input border on background 3.4:1 and on leaf sage 3.1:1;
destructive on background 6.1:1. The deep sage holds no bordered control (it is
only the care panel and the brand tile hover), so the input border's 2.9:1 there does
not apply.

The ground is warm and the bands are green on purpose: the two logo colours each
own a surface, and the bands stay distinct from the page by hue, not by darkness.

### Type

- **Noto Sans**, `--font-sans`: the interface, the hero and product titles, prices,
  the wordmark (bold, tracked, uppercase).
- **Belleza**, `--font-heading`: section titles (`SectionHeading`, the About
  statement, page titles in `PageShell`, card and empty-state titles). The mockup's
  section face is a flared humanist in the Optima family; Belleza was the closest of
  eight Google candidates compared side by side against the render. Falls back to
  Optima, then Candara.
- Headings default to weight 400 with `text-wrap: balance`; the font is chosen at
  the call site because the design mixes a sans hero title with serif section titles.
- Scale tokens: `text-display` (hero and listing titles, `clamp(1.75rem, 2.6vw,
  2.25rem)`), `text-title` (section titles, `clamp(1.75rem, 2.4vw, 2.125rem)`),
  `text-heading` (product title, the routine, `clamp(1.5rem, 2vw, 1.875rem)`).

### Shape and layout

- `--radius: 0.375rem`, used only for cards and the routine steps. Buttons, inputs,
  selects, toggles, badges, alerts, empty states and image tiles are square.
- `--container-page: 90rem` (`max-w-page`), with `px-4 md:px-8`: the design runs
  edge to edge at 1400px with 32px gutters.
- Bands (hero, category band, About, brands, routine, care, footer) are full-bleed;
  their content sits in `max-w-page`.
- Buttons: `default` bottle green; `outline` with the `--input` border; `overlay` for
  imagery, filled bottle green with a white focus ring (the hero and the image band); sizes `lg` (56px), `cta` (64px, the design's "Discover more" with the
  arrow pushed to the end) and `inline` (text links with an arrow).
- Touch targets: 44px buttons, toggles, inputs and selects, as before.

### Motion

Only in response to the customer: sheet, accordion and mega-menu transitions, the
image scale on product cards. The hero carousel does not autoplay. Everything stops
under `prefers-reduced-motion`.

### Light only

There is no dark palette and no `dark:` utility anywhere. `:root` sets
`color-scheme: light`, so native controls and scrollbars stay light when the
operating system is dark ([ADR 0012](../decisions/0012-the-storefront-is-light-only.md)).

---

## Remaining

- Real photography to replace `public/art/`.
- An optical check of the wordmark with a brand name much longer than "TrueLux"
  (ADR 0007).

---

## Decisions

### Decision: brand tailoring lives in `components/ui`

**Decision**

Square corners, the CTA and overlay button variants, the mega-menu, the carousel
dots and progress rule, and the menu row variant are edits to the generated files.

**Reason**

ADR 0009: the look is owned in one place, so a call site states layout only.

**Consequence**

Re-running `shadcn add --overwrite` on those files loses the edits. Use `--diff`
and merge.

### Decision: text over imagery gets a scrim

**Decision**

The hero and listing bands lay a left-to-right `--scrim` gradient under their white
text.

**Reason**

The mockup's white text on pale beige photography measures well under 3:1. The
scrim holds contrast whatever image the merchant eventually supplies.

**Consequence**

The hero reads darker and cooler than the mockup; recorded in design-alignment.md.

---

## Gotchas

- `components/ui/toggle.tsx` has no `"use client"`, and the radius lives in each
  variant, not the base: filter links call `toggleVariants()` without `cn`, so a base
  `rounded-none` and a swatch's `rounded-full` would both land and CSS order would
  pick.
- The Open Graph image (`app/opengraph-image.tsx`) repeats `--ink`, `--gold` and
  `--ink-muted` as hex values, because `ImageResponse` cannot read CSS variables:
  the card is the logo's green with the name in gold. Change both together.
- **The site icon is the logo** (`app/icon.jpg`, `app/apple-icon.jpg`, copies of
  `public/truelux-logo.jpg`). The supplied file is a 150px JPEG; replace all three
  when a larger or vector logo arrives.
- `Alert` always renders `role="alert"`. Use it for failures only.
- `prettier-plugin-tailwindcss` has no `tailwindStylesheet` configured, so it sorts
  theme classes such as `text-muted-foreground` as unknown and puts them first.

---

## Tests

Visual design is not unit-tested. The pages were compared against the renders with
Playwright screenshots at 1400px and 375px, against a local stub of the API; see
design-alignment.md.

---

## Files

```text
app/globals.css
app/icon.jpg
app/apple-icon.jpg
app/layout.tsx
app/opengraph-image.tsx
public/truelux-logo.jpg
components/ui/
public/art/
```
