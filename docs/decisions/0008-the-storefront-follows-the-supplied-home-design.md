# ADR 0008: The storefront follows the supplied home design

> **Superseded** on 2026-09-25 by
> [ADR 0010](0010-the-truelux-visual-direction.md). The clothing mockup this ADR
> followed is no longer in the repository; TrueLux has its own direction, built on
> shadcn/ui (ADR 0009). Kept for history.

Status: Superseded by [ADR 0010](0010-the-truelux-visual-direction.md)

Date: 2026-09-24

Supersedes: parts of `design-system.md` (the two-grid decision, the wordmark
decision, Newsreader for prose, the one motion moment), and the visual half of
[ADR 0007](0007-the-brand-wordmark-is-configuration.md)

---

## Context

The storefront's visual system was built from `design-system.md`, written before
any mockup existed. It paired Archivo with Newsreader, set the brand name as a
large clipped wordmark, used an asymmetric home grid with frameless tiles, and
spent its one motion moment on the home hero.

A mockup of the clothing home page then arrived (it is no longer in the repository): 1280 wide, with every glyph
outlined and 55 MB of embedded photography. It differs from that system almost
everywhere:

- A textured light-grey page
- A heavy, wide grotesque for headlines, and Inter in the footer
- Photographs in 1px frames
- A header with a menu icon, a diamond mark, and wishlist, cart and account
  discs
- Two carousels
- A footer of pricing, languages and "technologies" columns

The merchant asked for it to be copied exactly and applied site-wide, with
placeholders for the images.

---

## Decision

The mockup is the visual source of truth. Its tokens replace the old ones
site-wide: palette, type, the tile frame, header and footer. The home page
reproduces its layout at 1280 and stacks below that.

Where the mockup and the backend contract disagree, the contract wins on
**data**, and the mockup wins on **appearance**:

- **Prices** stay in rupees from `formatPrice`, not the mockup's `$`.
- **Categories, product names and counts** come from the API. The brand name
  replaces the mockup's "XIV" and "elegant vogue".
- **Controls with nothing behind them are drawn but inert:** wishlist, account,
  languages, and the footer's pricing, about, contacts and privacy entries. The
  tile's quick-add "+" was drawn too, then removed on 2026-09-24 at the
  merchant's request. They are plain text or `aria-hidden` shapes, never a
  `<button>` or a link that goes nowhere, so a keyboard or screen reader user is
  not offered a control that does nothing.
- **Controls that can be real are real**, through the listing's URL:
  - the category tabs and "Filters(+)"
  - the price sorts (`ordering=base_price` and `-base_price`)
  - search, as a plain GET form to `/products`
  - "See All", "More" and "Go To Shop"
  - the carousel arrows

---

## Reason

The merchant owns the look of the shop. The backend owns prices, stock and the
catalogue. Drawing a control inertly costs only honesty about what it does,
which the markup keeps. Inventing the data behind it would contradict the API.

---

## Alternatives considered

### Apply the design to the home page only

Rejected by the merchant. The header, footer and tokens are shared, so the home
page would look like a different shop from the rest.

### Omit every control the API cannot back

This is the repository's default. The merchant chose to keep them as visuals.

---

## Consequences

### Positive

- The shop matches the mockup it was sold on.
- The listing and product pages inherit the new palette and tile with no change
  to their code.

### Negative

- **Inert controls look operable.** A sighted customer can click the heart or
  the account disc and nothing happens.
- **The colour swatches with "+N" counts are omitted.** Every other inert control
  is drawn, but these are not: the list payload has no variants, so any colour or
  number drawn would be a false claim about a product.
- **Some greys are darker than the mockup's.** The footer's 40% and 60% black,
  and the `#8a8a8a` tabs, fail contrast. They use `--slate` and `--mute`.
- **Newsreader is gone**, so product descriptions and the order pages' prose are
  set in the text face, now Syne. See the revision below.
- **The single hero-settle moment is gone.** The second pass replaced it with
  the motion described below.

### Constraints introduced

- New surfaces use the mockup's vocabulary:
  - 1px `--line` frames on photographs
  - `--wash` fills on controls
  - `font-display` black for headlines (Schibsted Grotesk since the revision)
- Adding a real wishlist or account feature later means replacing the inert
  shapes in `Header.tsx`, not adding beside them.

---

## Revision: 2026-09-24, second pass

These changes were made after a review of the first build.

### Fonts

The mockup is set in three faces:

- headlines in Sharp Type's **Beatrice Display**, recognisable by the hairline
  diagonals in its heavy N and W
- text in **Beatrice**
- tabs, sorts and the footer in **Inter**

Beatrice is commercial and unlicensed here. About twenty free grotesques were
set beside crops of the mockup. The closest were:

- **Schibsted Grotesk Black** for headlines
- **Syne** for text, which is very close to Beatrice's text cuts

Inter is exact. Archivo and its `wdth-*` utility are gone. If the merchant
licenses Beatrice for the web, it replaces the two stand-ins through
`next/font/local` in `app/layout.tsx`. The tokens do not change.

### One scheme

The dark palette is removed. The shop is the mockup's light paper
everywhere, with `color-scheme: light`.

The grain is the mockup's own paper texture, baked into a 25KB tile at the
blend the mockup uses: 20% luminosity over white. The footer multiplies the
same tile over `--band`, which lands on the mockup's `#ebebeb`.

### Motion

Motion (`motion`, the successor to Framer Motion) is added. It drives three
things, each of which needs scroll or state that CSS cannot reach:

- the header that hides on the way down and returns on the way up
- the headline reveals on scroll
- the parallax on the approach plates, and the cart count's pop

The above-the-fold entrances are CSS keyframes instead: headline lines
rising, slides unveiling, and fades. That way they run before hydration and
without JavaScript.

Every moving piece renders its settled state under reduced motion. The
global rule also zeroes animation delays. Nothing is ever hidden unless
JavaScript is running and it is below the fold.

## Implementation

| Area | Files |
| --- | --- |
| Tokens and type | `app/globals.css` (tokens, `grain`, entrances), `app/layout.tsx` (Schibsted Grotesk, Syne, Inter), `public/grain.jpg` |
| Motion | `components/layout/HeaderFrame.tsx`, `components/home/{RevealLines,ApproachPlates}.tsx`, `CartButton.tsx` |
| Shell | `components/layout/{Header,CartButton,MobileNav,Footer,LogoMark}.tsx` |
| Tile | `components/catalog/ProductCard.tsx` |
| Home | `components/home/*` and `app/page.tsx`, see `features/storefront-home.md` |
