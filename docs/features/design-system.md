# Design system

Status: Implemented

Last updated: 2026-09-26

---

## Goal

Give the storefront one visual identity, expressed as theme tokens and one
component library, so every feature is an application of a decided system rather
than a fresh set of choices.

---

## Scope

What is included in this implementation?

- The direction of [ADR 0011](../decisions/0011-the-storefront-follows-the-supplied-design.md):
  the client's mockups in `docs/design/`, re-expressed as shadcn theme variables.
  A near-white ground, charcoal text and primary, a greige and a stone band, square
  controls, thin rules
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

ADR 0011 supersedes ADR 0010's rose-nude direction. The mockups were measured from
the PNG renders in `docs/design/renders/`; see [design-alignment.md](design-alignment.md)
for the page-by-page mapping and deviations.

---

## Implemented

### Colour tokens

Defined once in `app/globals.css` and mapped to Tailwind colours under
`@theme inline`. No component holds a hex value.

| Token | Value | Role |
| --- | --- | --- |
| `--background` | `#fdfdfb` near-white | Page |
| `--foreground` | `#333333` charcoal | Text, the header's bottom rule, the open-menu bar |
| `--card` | `#ffffff` | Cards, the routine steps |
| `--popover` | `#fdfdfb` | Sheets, the mega-menu |
| `--primary` | `#333333` | Primary buttons (Add to bag, Checkout), the focus ring |
| `--primary-foreground` | `#ffffff` | Text on primary |
| `--secondary` | `#e8e6dd` stone | The stone bands: About, the product care panel |
| `--muted` | `#f3f2ee` greige | The greige bands (category band, brands, routine), image tiles, skeletons |
| `--muted-foreground` | `#66655f` | Secondary text |
| `--accent` | `#f3f2ee` | Hover backgrounds |
| `--destructive` | `#a3392f` | Checkout and lookup failures |
| `--border` | `#d6d5cf` | Hairlines |
| `--input` | `#8a8983` | Control borders and the outlined CTA, 3:1 against the page |
| `--ring` | `#333333` | Focus |
| `--ink`, `--ink-foreground` | `#333333`, `#ffffff` | The announcement bar and the footer |
| `--ink-muted` | `#c9c8c2` | Secondary text on ink |
| `--on-image` | `#ffffff` | Text and outlined buttons over imagery |
| `--scrim` | `rgb(40 36 30 / 0.45)` | The gradient behind text on the hero and listing images |
| `--chart-1`…`5` | charcoal to stone | Reserved for the admin's charts |

Removed: `--gold` and `--shade-1`…`8` (the old accent and the hero's shade ribbon).

Measured contrast (WCAG): foreground on background 12.4:1; muted-foreground on
background 5.7:1, on greige 5.2:1, on stone 4.7:1; ink-foreground on ink 12.6:1;
ink-muted on ink 7.5:1; input border on background 3.4:1 and on greige 3.1:1;
destructive on background 6.5:1.

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
- Buttons: `default` charcoal; `outline` with the `--input` border; `overlay` for
  imagery; sizes `lg` (56px), `cta` (64px, the design's "Discover more" with the
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
- The Open Graph image (`app/opengraph-image.tsx`) repeats the light theme's hex
  values, because `ImageResponse` cannot read CSS variables. Change both together.
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
app/layout.tsx
app/opengraph-image.tsx
components/ui/
public/art/
```
