# Design system

Status: In progress

Last updated: 2026-09-24

> **Superseded in large part by
> [ADR 0008](../decisions/0008-the-storefront-follows-the-supplied-home-design.md).**
> The palette, type, tile frame, header and footer now follow the mockup at
> `docs/design/Home.svg`. The Planned sections below describe the earlier
> direction. Where they conflict with *Implemented* or with ADR 0008, those win.
> Radius, the focus ring, the primitives and the dark-mode token mechanics
> still stand.

---

## Goal

Give the storefront one visual identity, expressed as tokens and a small set of
primitives, so that every later feature is an application of a decided system
rather than a fresh set of choices.

---

## Scope

What is included in this implementation?

- The token set — colour, type, scale, spacing, radius, motion — declared once in
  `app/globals.css` under Tailwind v4's `@theme`
- Typeface selection and loading
- The type scale and the roles each face plays
- `components/ui/` primitives: `Button`, `Link`, `Field`, `Radio`, `Quantity`,
  `Dialog`, `Skeleton`, `Price`
- The rules that keep later work inside the system: no arbitrary colours, radius
  reserved for interactive elements, one orchestrated motion moment
- Dark mode by `prefers-color-scheme`

What is explicitly outside the scope?

- Page layouts, which belong to `site-shell.md` and `storefront-home.md`
- Any component that knows what a product is
- Icons beyond the handful the storefront actually uses
- A theme toggle, a theme provider, or runtime theming
- A component gallery or Storybook

---

## Context

The brand sells everyday streetwear — tees, hoodies, oversized shirts, cargos —
to 18–30 year olds in Kathmandu, and is moving off Instagram. The direction chosen
for the storefront is **editorial**: large type, generous whitespace, full-bleed
photography, near-monochrome with a single accent.

That combination is the point. Streetwear photographed and typeset the way a
fashion house treats a collection is a specific, defensible position, and it is
what distinguishes this from the dense filter-rail retail grid the same catalogue
could have been given.

Two constraints come from elsewhere and shape the system directly:

[ADR 0007](../decisions/0007-the-brand-wordmark-is-configuration.md) makes the
brand name an environment variable, so the wordmark is **set type of unknown
length**. It cannot be drawn, hand-kerned, or laid out around a fixed silhouette.

The API supplies images with **no dimensions, no aspect ratio, and no placeholder**,
and `alt_text` that may be empty. Every image treatment in the system has to state
its own aspect ratio, or the grid reflows as photographs arrive.

---

## Planned

### Palette

Five tokens. Near-monochrome, with the accent spent in one place.

```css
@theme {
  --color-ink:    #000000;  /* type, rules, the wordmark */
  --color-paper:  #F2F3F1;  /* page background — cool, faintly green-grey */
  --color-wash:   #E4E6E2;  /* secondary surfaces, hairlines, disabled */
  --color-slate:  #6B6F6E;  /* secondary type */
  --color-indigo: #1B2A7A;  /* the accent */
}
```

**The paper is cool, not cream.** A warm off-white near `#F4F1EA` with a serif and
a terracotta accent is the house style of every generated fashion page; this one
runs slightly green-grey, which reads as newsprint and photographic paper rather
than as parchment, and it makes black photography sit correctly on it.

**The ink is true black**, not a tinted near-black. A `#0B0B0B` that nobody can
distinguish from black is a tell without a reason.

**The accent is indigo**, because indigo is a dye and this is a clothing brand. It
is used for exactly three things: focus rings, the active state of a selected
variant, and links inside body copy. It is never a background for a large area and
never a decorative wash.

Dark mode redefines the same five tokens under `prefers-color-scheme: dark` — ink
and paper invert, indigo lightens to hold its contrast. There is no toggle and no
theme state.

### Type

Two families, with roles that do not overlap.

| Face | Role | Why |
| --- | --- | --- |
| **Archivo** (variable, incl. width axis) | The wordmark, headlines, all UI — prices, buttons, labels, forms, navigation | A grotesque with a real width axis. Confident and poster-like at display sizes, plain and legible at 14px |
| **Newsreader** | Long-form copy only — product descriptions, the home page's editorial passages | Low-contrast, newsprint-adjacent, comfortable in a paragraph. It is what makes the page read as a publication rather than as a form |

**Archivo's width axis is load-bearing, not decoration.** The wordmark is set from
`env.brandName`, whose length is unknown, so the width axis is what lets a
four-character name and a three-word name both fill the same measure and both look
deliberate. This is the one place the system responds to configuration.

Type scale, a modular progression rather than arbitrary sizes:

```text
display   clamp(3.5rem, 12vw, 9rem)   Archivo, weight 700, width 125, tight
title     2.25rem                      Archivo, weight 600
heading   1.5rem                       Archivo, weight 600
body      1rem   / 1.6                 Newsreader
ui        0.9375rem / 1.4              Archivo, weight 500
detail    0.8125rem / 1.4              Archivo, weight 500, slate
```

Body measure is capped below 72 characters. Newsreader gets slightly more
line-height than the grotesque would need, because a serif does.

Typographic treatments this system does **not** use, stated so they are not
introduced later as polish:

- **No tracked-out capital labels above headings.** A category name is a heading or
  a link; it is not an eyebrow. Capitals appear in the wordmark, where they are a
  wordmark, and in a size code like `M`, where the garment label says `M`.
- **No accenting one word of a headline** in a second colour, weight or italic.
- **No arrows appended to link text.** A link is a link.
- **No middle-dot meta strings.** Metadata is laid out, not concatenated.
- **No monospace for small labels.** There is no code on this site.

### Layout and structure

Left-aligned throughout. Nothing is centred except a modal, and nothing is
justified.

**Structure carries information.** Radius is the clearest example: **every corner
in the system is square except interactive controls, which carry `2px`.** A
customer learns in one page that rounded means pressable. Photography, panels and
containers are square-cornered, which is also what makes the full-bleed imagery
read as photography rather than as cards.

There are no shadows anywhere. Depth, where it is needed, is an inset hairline in
`--color-wash`.

Hairlines are used only where they separate things that are genuinely separate —
the lines of an order summary, the edge of a sticky header once the page has
scrolled. They are not applied to every section as a device.

Two grids, and the difference between them is deliberate:

```text
HOME — editorial rhythm            LISTING — uniform, comparable
┌──────────────────────────┐       ┌────────┬────────┬────────┐
│                          │       │        │        │        │
│      full bleed          │       │  image │  image │  image │
│                          │       │        │        │        │
└──────────────────────────┘       ├────────┼────────┼────────┤
┌────────────┐ ┌───────────────┐   │ name   │ name   │ name   │
│            │ │               │   │ price  │ price  │ price  │
│   5 cols   │ │    7 cols     │   ├────────┼────────┼────────┤
└────────────┘ └───────────────┘   │        │        │        │
┌───────────────┐ ┌────────────┐   │  image │  image │  image │
│    7 cols     │ │   5 cols   │   │        │        │        │
└───────────────┘ └────────────┘   └────────┴────────┴────────┘
```

The home page sells and may be irregular. The listing is for comparing garments,
so its tiles are the same size and its metadata sits at the same height on every
one. An asymmetric listing looks better in a screenshot and is worse to shop.

Product metadata sits **below and outside** the image, in a two-line block — name,
then price — the way a lookbook captions a plate. There is no card, no border and
no background behind a product tile. The photograph is the tile.

### The one bold thing

The home hero: the wordmark set in Archivo at maximum width and weight, sized to
the viewport and **clipped by its right edge**, over a single full-bleed
photograph. It is a lookbook-cover gesture and it is the only place the system
raises its voice.

Everything else stays quiet. If a later feature wants to be striking, the answer is
almost always no — the boldness is spent.

### Motion

- **One orchestrated moment**, on the home page: the hero image settles from a
  slight scale on load. Once, not on every visit to every section.
- **Interaction motion only** elsewhere: selecting a size, opening the cart,
  confirming an add. Motion shows what changed; it does not announce arrival.
- No scroll-triggered reveals. No hover lift on product tiles. A tile responds to
  hover with the image, not with the container.
- Every transition respects `prefers-reduced-motion`, and the reduced path is a
  state change with no duration rather than a slower version of the same thing.

### Primitives

`components/ui/`, none of which know what a product is:

| Primitive | Notes |
| --- | --- |
| `Button` | `primary` and `ghost` variants from a lookup object. Renders `<button>`; a navigating action uses `Link` |
| `Link` | Wraps `next/link`. Underlined in body copy, unstyled in navigation |
| `Field` | Label, input, hint, error. The error slot is what a 400's `details` renders into |
| `Radio` | The group used by the size and colour pickers. Supports a disabled-and-announced state |
| `Quantity` | Stepper with a text input. 44px targets |
| `Dialog` | The cart drawer and the mobile menu. Headless underneath |
| `Skeleton` | For the browser-fetched routes, which have no server-rendered content |
| `Price` | Renders a `Money` string through `formatPrice`. The only component that displays an amount |

`Dialog` is the one place a headless library earns its dependency: focus trapping,
scroll locking, dismissal and `aria-modal` are genuinely hard to hand-roll
correctly, and getting them wrong locks a keyboard user inside the cart. Everything
else is a native element with styles.

### Copy voice

Plain, declarative, sentence case. Active voice, and an action keeps its name for
the whole flow — the button that says "Add to bag" produces a confirmation that
says "Added to bag".

Failures explain what happened and what to do, in the interface's voice. They do
not apologise and they are never vague. Empty states invite an action rather than
setting a mood.

---

## Implemented

- **`Combobox` (2026-09-24):** a text field that filters a fixed list, built
  in-repo on the WAI-ARIA editable-combobox pattern rather than shadcn. It
  has the same look and behaviour with no new tooling, since CLAUDE.md rules
  out a component library.
  - It takes `Field`'s control props and posts its value through a hidden
    input.
  - It joins native validation through `setCustomValidity`.
  - Prefix matches sort before substring matches (`filterOptions`).
  - Tested in `Combobox.test.tsx`.
  - `tests/setup.ts` stubs `scrollIntoView`, which jsdom lacks.
- **`Sheet` (2026-09-24):** a right-edge panel on Radix Dialog, up to 440px
  wide, framed by a `--line` border.
  - Its title is visible and is the dialog's name.
  - It has no trigger of its own. The caller passes `returnFocusRef` so
    focus goes back when it closes.
  - It animates with `animate-sheet-in`/`-out` and `animate-fade-in`/`-out`.
- **Added 2026-09-24, for loading and catalogue work:**
  - **`Spinner`:** a ring with an open quarter in `currentColor`, marked
    decorative. The control beside it carries the words.
  - **`Button`'s `pending` prop:** shows the spinner and sets `aria-busy` and
    `aria-disabled`, but not `disabled`, so focus stays put. Used by "Place
    order", "Find order" and a recent order's "View". The cart's "Checkout"
    link shows one through `useLinkStatus`, pinned so its label never moves.
  - **`Skeleton`:** a faint light band now crosses it (`animate-shimmer`). The
    band is static under reduced motion.
  - **Skeletons follow real layouts:**
    - the listing (rail and grid)
    - the product page
    - cart lines
    - the checkout form and summary
    - the order view
    - the root fallback
  - **`scroll-quiet`:** a panel's own scrollbar in the theme.
  - **Scrollbars:** the page scrollbar takes `--edge` through
    `scrollbar-color`.
  - **`--header-offset`:** 76px, 90px from `md`, and 0 while the header is
    hidden. Every sticky element sits at it.
  - **`<details>` height:** animated through `interpolate-size` and
    `::details-content`.
  - **`ProductCard`:** the inert "+" is removed.
- **Since ADR 0008's second pass:**
  - **Fonts:** Schibsted Grotesk (`--font-display`), Syne (`--font-text`, the
    body default) and Inter (`--font-utility`). Archivo and `wdth-*` are removed.
  - **Colour:** light only. The dark block is removed, and `color-scheme` is
    `light`.
  - **Grain:** the `grain` utility is `public/grain.jpg`, baked from the
    mockup's texture.
  - **Motion:**
    - `--ease-settle` is the single curve.
    - `animate-rise`, `animate-unveil`, `animate-settle` and `animate-fade` are
      CSS entrances.
    - `motion` is a dependency.
    - The reduced-motion block also zeroes delays.
- **Since ADR 0008:**
  - **Tokens:** `ink #262626`, `paper #f3f3f3`, `wash #d5d5d5`,
    `slate #5e5e5e`, `mute #6f6f6f`, `line #d7d7d7`, `edge #a3a3a3`,
    `band #ebebeb` and `indigo #000e8a`, each with a dark value.
  - **Grain:** the page carries a tiled `feTurbulence` grain instead of the
    mockup's 12 MB paper photograph.
  - **Type:** `--text-poster` is the headline size, and `@utility wdth-*`
    drives Archivo's width axis. `--font-prose` is now Archivo.
  - **Fonts:** Inter is loaded for the footer, and Newsreader is removed.
  - **Removed:** `--text-display` and `.hero-settle`.
  - **`ProductCard`:** a 1px `--line` frame, a 365:375 aspect, an inert "+",
    and category above name and price.
  - **Deleted:** `Wordmark.tsx` and its test.
  - **`Chevron.tsx`:** new, for the carousel arrows and "More".
- `app/globals.css` — the five colour tokens on `:root`, redefined under
  `prefers-color-scheme: dark` and exposed through `@theme inline` so the scheme
  switches at runtime; the type scale; `--radius-control`; the focus ring; the
  reduced-motion block; and `.prose-body`, which is opt-in because most text on
  this site is interface rather than prose
- `app/layout.tsx` — Archivo loaded with `axes: ["wdth"]` and Newsreader, both as
  CSS variables. Geist is gone
- `components/ui/Button.tsx` — `primary` and `ghost` from a lookup object, a
  44px minimum target, and `type="button"` by default
- `components/ui/Dialog.tsx` — Radix Dialog, owning its own trigger
- `components/ui/Skeleton.tsx` — a static block; it does not pulse
- `components/ui/Price.tsx` — the only component that renders an amount, with no
  `quantity` prop, because multiplying here is the mistake ADR 0003 prevents
- `components/layout/Wordmark.tsx` — the width axis driven by the name's length
- `components/ui/Field.tsx` — label, hint, error, and a render prop for the
  control, so an input, a native select and a textarea keep every platform
  attribute. It hands the control its `id`, `aria-describedby` and
  `aria-invalid`; `controlClass` styles all three with a full-strength slate
  border, because a control boundary needs 3:1 against the page. `RadioGroup`
  takes an `error` wired the same way
- `app/globals.css` declares `color-scheme: light dark`: native controls (the
  district select's popup, a textarea's scrollbar) draw from it, not from the
  tokens, and stayed light in dark mode until checkout was the first page to
  have any
- `components/ui/Dialog.test.tsx`, `components/layout/Wordmark.test.tsx`

Verified by looking at it: light and dark at 1440 and at 390, the mobile dialog's
keyboard path, and the wordmark at a four-character and a three-word name.

---

## Remaining

- Every primitive with a consumer is built. `Field` landed with `checkout` (#7),
  as `Radio` did with `product-detail` (#5) and `Quantity` with `cart` (#6).
  What keeps this feature In progress is the two merchant decisions below, not
  code.
- The `Link` primitive was not built either: `next/link` plus a token class is
  doing the job, and wrapping it to rename it would be a wrapper function that
  only renames another function.

Two things need a decision that cannot be made here:

- **Photography does not exist yet.** The entire direction rests on full-bleed
  product images, and the brand's current assets are Instagram posts. Every layout
  in this system needs to be checked against a real photograph at a real aspect
  ratio before it is called done, and the merchant needs to know that square
  Instagram crops will not fill a hero.
- **The brand name is unset.** The wordmark treatment can be built and tested
  against several lengths, but the final optical judgement — the one thing a
  configurable wordmark cannot fully replace — waits on the name.

---

## Decisions

### Decision: radius means interactive

**Decision**

Zero radius on every container, panel and image. `2px` on buttons, inputs and
other controls.

**Reason**

Applying one radius to everything is the commonest tell of a templated interface,
and it wastes a signal. Reserving it makes it informative: a customer learns in one
screen that rounded corners can be pressed.

**Consequence**

A control that needs to look like a surface, or a surface that needs to look
pressable, has to solve it some other way. Nothing may be given a radius "to soften
it".

### Decision: two grids, because the home page and the listing have different jobs

**Superseded** by ADR 0008: the home page now uses a rail and a uniform three-column grid, as in the mockup.

**Decision**

The home page uses an asymmetric editorial rhythm. The product listing is a
uniform grid with metadata at a consistent height.

**Reason**

An irregular grid photographs beautifully and shops badly — the eye cannot compare
prices across tiles of different sizes, and a customer scanning for a size is doing
exactly that comparison.

**Consequence**

Two layout systems to maintain, and a temptation to unify them. The listing is the
one that must not move.

### Decision: the accent is spent on three things

**Decision**

Indigo appears on focus rings, the selected variant, and links inside body copy.
Nowhere else.

**Reason**

A near-monochrome palette only reads as deliberate if the accent is rare. An accent
used on every call to action is just a brand colour.

**Consequence**

The primary button is black on paper, not indigo. If a later feature needs
emphasis, it gets scale or position, not colour.

### Decision: Radix is the headless library, and only for `Dialog`

**Decision**

`@radix-ui/react-dialog`, used by `components/ui/Dialog.tsx` and nothing else.

**Reason**

Focus trapping, focus restoration, scroll locking and `aria-modal` are the four
things a hand-rolled panel gets wrong, and getting them wrong locks a keyboard
user inside the menu. A single-purpose package is a small dependency for a large
correctness gain.

Radix rather than Base UI: Base UI is the successor and is the better bet later,
but it is still moving, and this is one component.

**Consequence**

One dependency, scoped to one file. Anything else that wants a headless
behaviour is a new decision, not an extension of this one — and the default
answer stays a native element.

### Decision: the dialog owns its trigger

**Decision**

`Dialog` takes a `trigger` prop and renders it through `RadixDialog.Trigger`,
rather than letting the caller open it from a button of its own.

**Reason**

Found by checking the keyboard path in a browser rather than by reading the code.
Opening from an outside button leaves focus on `<body>` when the panel closes,
which drops a keyboard user at the top of the document with no indication of
where they were. Radix restores focus to its own trigger.

**Consequence**

A caller cannot open the dialog from an arbitrary element without passing it as
the trigger. `Dialog.test.tsx` pins the restoration, because this is a
regression nobody notices by clicking.

### Decision: the wordmark responds to its own length

**Superseded** by ADR 0008: there is no visual wordmark; `Wordmark.tsx` is deleted.

**Decision**

The wordmark is set in Archivo with its width axis driven by the length of
`env.brandName`.

**Reason**

[ADR 0007](../decisions/0007-the-brand-wordmark-is-configuration.md) rules out a
drawn logo, which is the usual answer for an editorial header. A variable width
axis recovers most of what that loses: the name fills its measure whatever it says.

**Consequence**

The typeface choice is constrained — it must have a width axis, which rules out
most of the obvious display faces. Archivo is chosen for that as much as for its
look.

---

## Gotchas

- **The API sends no image dimensions.** Every `next/image` must state its own
  `sizes` and aspect ratio, or the grid reflows as photographs load. This is the
  largest layout-shift risk in the storefront and it cannot be fixed at the source.
- **`alt_text` can be an empty string.** An empty alt means decorative, and the
  image gets `alt=""`. Substituting the product name produces a screen reader
  announcing the same phrase twice per tile.
- **The wordmark is unknown at design time.** Any layout checked only against the
  current brand name is untested. Check a four-character name and a three-word one.
- **Archivo's width needs `wdth-*`, not `font-stretch`.** The mockup's
  headlines measure about 108. At the 125 maximum they overran the hero column
  by 70px.
- **Reduced motion is a different design, not a slower one.** The global block
  still zeroes durations. Nothing orchestrated remains, but the carousel's
  `scroll-smooth` relies on it to jump.
- Dark mode inverts a palette built for photography on light paper. Full-bleed
  images against a near-black page lose their edges, so the hero needs its own
  treatment rather than an inverted token.
- `@theme` in Tailwind v4 generates utilities from the token names, so renaming a
  token renames every class that uses it. Name them for their role, never for their
  appearance — `--color-paper`, not `--color-off-white`.
- **Tokens are declared on `:root` and mapped through `@theme inline`**, not
  written as literals inside `@theme`. A literal is resolved at build time and
  cannot change for the dark scheme, so the whole palette would be stuck in one
  mode with no error to say so.
- **The dark palette is not a mechanical inversion.** `--color-indigo` is lifted
  to `#8f9dff`, because `#1b2a7a` on a near-black page fails contrast. Inverting
  the other four and leaving the accent alone looks correct in a diff and is
  unreadable on screen.

---

## Routes

```text
None.
```

---

## API

```text
None.
```

---

## State and data

```text
None.
```

---

## Accessibility

- Contrast is checked for both schemes: ink on paper, slate on paper, indigo on
  paper, and every state of every control. Slate is the one at risk and is the
  reason it is not lighter.
- **Focus is always visible**, in indigo, at a width that survives a photograph
  behind it. Nothing in this system removes an outline without replacing it.
- Radius is not the only signal that something is interactive — controls also carry
  a hover state and a cursor change, because a customer who cannot perceive a 2px
  corner still needs to find the button.
- Colour never carries meaning alone. "Sold out" is a word.
- Touch targets are 44px on the three controls a phone actually uses: the size
  picker, the quantity stepper, and add to bag.
- `Dialog` traps focus, restores it on close, and dismisses on Escape and on
  backdrop click.

---

## Tests

- `components/ui/Radio.test.tsx` — keyboard navigation within the group, and that a
  disabled option is announced as unavailable rather than merely skipped
- `components/ui/Quantity.test.tsx` — bounds, and that typing a non-number does not
  produce `NaN`
- `components/ui/Dialog.test.tsx` — focus trap, restore on close, Escape
- `components/ui/Price.test.tsx` — that it renders through `formatPrice` and never
  through string interpolation

Visual work is verified by looking at it. There are no snapshot tests; a snapshot
of markup is a change detector, not a test.

---

## Files

```text
app/globals.css              the @theme token block, both schemes
app/layout.tsx               font loading
components/ui/
docs/decisions/0007-the-brand-wordmark-is-configuration.md
```

---

## Future context

The direction is editorial treatment of streetwear, and the tension between those
two words is the whole identity. Anything that resolves the tension — making it
more editorial and less street, or more street and less considered — loses it.

The five generic looks this system was steered away from are worth knowing, because
each is one small change away: warm cream with a high-contrast serif and a
terracotta accent; near-black with an acid accent; a dense broadsheet of hairline
rules and columns; identical rounded cards with soft grey shadows; and the
tracked-out capital eyebrow above every heading. The palette, the radius rule, the
role split between the two faces, and the ban on eyebrow labels each exist to hold
one of those at arm's length.

Devanagari is deliberately absent. It would be a strong and locally specific motif,
and used decoratively — as texture, in a footer, under a Latin wordmark — it would
be worse than not using it. If it is introduced, it should carry real content in a
real typeface chosen with the merchant, not appear as an ornament.
