# Design system

Status: Implemented

Last updated: 2026-09-25

---

## Goal

Give the storefront one visual identity, expressed as theme tokens and one
component library, so every feature is an application of a decided system rather
than a fresh set of choices.

---

## Scope

What is included in this implementation?

- The TrueLux direction of [ADR 0010](../decisions/0010-the-truelux-visual-direction.md):
  quiet luxury, a warm ivory ground, espresso text, a muted rose-nude primary and
  champagne-gold accents used sparingly
- The token set as shadcn CSS variables in `app/globals.css`, light and dark
- Two typefaces through `next/font`
- The component vocabulary, which is shadcn/ui
  ([ADR 0009](../decisions/0009-shadcn-ui-is-the-component-library.md)); see
  [shadcn-foundation.md](shadcn-foundation.md)

What is explicitly outside the scope?

- A theme toggle. Dark mode follows `prefers-color-scheme` only.
- Real photography. Home imagery is generated SVG still lifes in `public/home/`.

---

## Context

The fork arrived with a streetwear mockup's palette (ink on grey paper, indigo
accent, a grain texture) and hand-built primitives. ADR 0010 replaces the
direction and ADR 0009 the primitives. [ADR 0008](../decisions/0008-the-storefront-follows-the-supplied-home-design.md)
is superseded and its mockup is no longer in the repository.

---

## Implemented

### Colour tokens

Defined once in `app/globals.css` and mapped to Tailwind colours under
`@theme inline`. No component holds a hex value.

| Token | Light | Dark | Role |
| --- | --- | --- | --- |
| `--background` | `#faf6f1` ivory | `#1e1512` | Page |
| `--foreground` | `#2b1d17` espresso | `#f3ebe3` | Text |
| `--card`, `--popover` | `#fffcf8` | `#261b17` | Raised surfaces, sheets |
| `--primary` | `#8e5a52` rose-nude | `#d9a79b` | Primary buttons, the focus ring |
| `--primary-foreground` | `#faf6f1` | `#1e1512` | Text on primary |
| `--secondary` | `#f1e6df` | `#33251f` | Secondary surfaces, the sold-out badge |
| `--muted` | `#f4ece6` | `#2c201b` | Image tiles, the footer, skeletons |
| `--muted-foreground` | `#6e5a50` | `#bfaea3` | Secondary text |
| `--accent` | `#f3ead9` champagne | `#3a2e22` | Hover backgrounds |
| `--destructive` | `#a63d32` | `#e07a6d` | Checkout and lookup failures |
| `--border` | `#e7dcd3` | `#3a2c26` | Hairlines |
| `--input` | `#a08672` | `#7e6a5e` | Control borders, 3:1 against the page |
| `--ring` | `#8e5a52` | `#d9a79b` | Focus |
| `--gold` | `#9a7b45` | `#c9a96e` | The sparing accent: promise icons, ritual numerals, the brand strip's rules |
| `--chart-1`…`5` | rose, gold, blush, taupe, espresso | lighter equivalents | Reserved for the admin's charts |
| `--shade-1`…`8` | `#f3dcc8` → `#4a2e1f` | same | The hero's shade ribbon, porcelain to deep |

Measured contrast (WCAG): foreground on background 15.1:1; muted-foreground on
background 6.0:1 and on muted 5.6:1; primary-foreground on primary 5.2:1; input
border on background 3.2:1; dark foreground on dark background 15.2:1.

### Type

- **Cormorant Garamond** (400, 500, 600), `--font-heading`: the wordmark and every
  `h1`–`h3` (set in the base layer), prices on the product page, order numbers.
- **Manrope**, `--font-sans`: everything else.
- Scale tokens: `text-display` (hero, `clamp(2.75rem, 6vw, 5rem)`), `text-title`
  (page titles, `clamp(2rem, 3.5vw, 2.75rem)`), `text-heading` (1.625rem); the rest
  is Tailwind's scale.

### Shape and layout

- `--radius: 0.75rem`. Buttons are pills (`rounded-full`, edited into
  `button.tsx`); cards and image tiles are soft rectangles.
- Product imagery sits on `bg-muted` tiles at 4:5.
- One content width, `max-w-7xl`, with `px-4 md:px-8`.
- Touch targets: buttons, toggles, inputs and native selects are 44px tall by
  default, edited into the generated files.

### The one flourish

The hero's shade ribbon: eight foundation tones, porcelain to deep, from the
`--shade-*` tokens. It is decorative (`aria-hidden`) and the only ornament on the
page. Motion is limited to responses to the customer's action (sheet and accordion
transitions, the image hover on product tiles) and stops under
`prefers-reduced-motion`.

### Dark mode

`@custom-variant dark (@media (prefers-color-scheme: dark))` and one
`@media (prefers-color-scheme: dark)` block redefining the variables, with
`color-scheme` switched so native controls follow. The SVG still lifes keep their
light palette in both schemes.

---

## Remaining

- Real product and editorial photography to replace the SVG placeholders in
  `public/home/`, when the merchant has it.
- An optical check of the wordmark against the final brand name at every width
  (ADR 0007): the layout is built for "TrueLux" and tolerates longer names, but has
  not been reviewed with one.

---

## Decisions

### Decision: dark mode is a media query, not shadcn's `.dark` class

**Decision**

The `dark` variant is `prefers-color-scheme`, and the variables are redefined in a
media block.

**Reason**

ADR 0010 says dark mode follows the operating system, and a class needs a theme
provider and client state the storefront does not otherwise have.

**Consequence**

shadcn's `dark:` utilities inside the generated components work unchanged. There is
no toggle to add without revisiting this.

### Decision: brand tailoring lives in `components/ui`

**Decision**

Pill buttons, 44px control heights, the `swatch` toggle variant and the card title
size are edits to the generated files, not classes at call sites.

**Reason**

ADR 0009: the look is owned in one place, so a call site states layout only.

**Consequence**

Re-running `shadcn add --overwrite` on those files loses the edits. Use `--diff`
and merge.

---

## Gotchas

- `components/ui/toggle.tsx` has no `"use client"`. The filter rail is a Server
  Component and calls `toggleVariants` to style its links; with the directive the
  call fails at render ("Attempted to call toggleVariants() from the server").
- The Open Graph image (`app/opengraph-image.tsx`) repeats the light theme's hex
  values, because `ImageResponse` cannot read CSS variables. Change both together.
- `Alert` always renders `role="alert"`. Use it for failures only; the checkout's
  cash-on-delivery note is a `Card` for that reason.

---

## Tests

Visual design is not unit-tested. The tokens were checked by rendering the home,
listing, product, brand, cart and checkout pages in light, dark and at 375px against
a local mock of the API.

---

## Files

```text
app/globals.css
app/layout.tsx
app/opengraph-image.tsx
components/ui/
public/home/
```
