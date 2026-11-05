# ADR 0013: The palette follows the logo

Status: Accepted

Date: 2026-10-14

Supersedes: the palette in [ADR 0011](0011-the-storefront-follows-the-supplied-design.md)

---

## Context

The client supplied a logo (`public/truelux-logo.jpg`): a deep bottle green ground
(`#143532`, about 80% of the image) with honey gold lettering and a leaf
(`#ebba65`). The storefront's palette came from the mockups (ADR 0011): neutral
charcoal, greige and stone, with nothing in common with the logo. The client asked
for the site to be re-themed from the logo.

---

## Decision

The colours come from the logo; layout, type and components still follow the
mockups (ADR 0011 otherwise stands).

- **Bottle green** is `--ink` and `--primary`: the announcement bar, the footer, the
  About band, primary buttons and the focus ring.
- **Honey gold** is `--gold` and appears **only on green**: the announcement text,
  the footer wordmark, the About statement. Wherever the green appears, it carries
  gold, as the logo does.
- The light surfaces split the two colours: the page is a warm ivory tinted from
  the gold (`#faf5e9`), the bands are a leaf sage (`#ebefe4`) and a deep sage
  (`#dde6da`), and text is green-black (`#1d2e2b`).
- The logo is the site icon (`app/icon.jpg`, `app/apple-icon.jpg`), replacing the
  fork's `favicon.ico`.

The storefront stays light only (ADR 0012).

---

## Reason

The logo is the client's identity; a shop in charcoal and greige under a green and
gold mark reads as two brands. Gold is restricted to green because it measures
1.6:1 on the page and 7.4:1 on the green: on the light ground it fails as text and
as a control boundary, and as decoration it would blur the one place the brand is
spent.

---

## Alternatives considered

### A green header with a gold wordmark

Why it was not chosen: the header would sit as a second dark band under the
announcement bar, and the mega-menu, search and bag icons would all need a second
set of on-ink styles. The green is kept to the bar, the About band and the footer.

### The logo image as the header wordmark

Why it was not chosen: ADR 0007 keeps the wordmark as type from
`NEXT_PUBLIC_BRAND_NAME`, and the logo reads "trūe luxe beauty" while the
configured name is "TrueLux". Until the name is settled, an image would disagree
with every page title. The supplied file is also a 150px JPEG on a green square.

---

## Consequences

### Positive

- The shop, the icon and the social card share the logo's colours.
- Every pairing in the palette passes WCAG AA; see `design-system.md`.

### Negative

- Gold is unavailable on light surfaces, so a sale or a highlight on the page cannot
  use it.

### Constraints introduced

- `text-gold`, `bg-gold` and `border-gold` are only used on `bg-ink`.
- The Open Graph image repeats `--ink`, `--gold` and `--ink-muted` as hex values;
  change them together.

---

## Implementation

```text
app/globals.css
app/icon.jpg
app/apple-icon.jpg
app/opengraph-image.tsx
components/layout/{AnnouncementBar,Header,Footer}.tsx
components/home/About.tsx
docs/features/design-system.md
```

---

## Future reconsideration

Revisit when the brand name is settled and a vector logo is supplied: the header
could then carry the drawn mark (ADR 0007's own reconsideration).
