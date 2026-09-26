# ADR 0010: The TrueLux visual direction

Status: Superseded by ADR 0011

Date: 2026-09-25

Supersedes: [ADR 0008](0008-the-storefront-follows-the-supplied-home-design.md)

---

## Context

The fork followed a streetwear mockup. TrueLux sells skincare, makeup and fragrance
and has no supplied design, so the storefront needs its own direction for the client
demo.

---

## Decision

The direction is quiet luxury:
- **Palette:** a warm ivory background, deep espresso text, a muted rose-nude
  primary, and champagne-gold accents used sparingly.
- **Type:** a refined serif display face (for example `Cormorant Garamond` or
  `Fraunces`) for headings and the wordmark, and a clean sans (for example `Inter` or
  `Manrope`) for UI, loaded with `next/font`.
- **Layout:** generous whitespace and soft radii, with product imagery on tinted
  tiles.
- **Dark mode** follows `prefers-color-scheme`.

The wordmark stays configuration (ADR 0007).

---

## Reason

The direction fits the category, and it can be expressed entirely in shadcn theme
variables (ADR 0009).

---

## Consequences

### Constraints introduced

- The colours live only in `app/globals.css` variables. No hex values in
  components.
- `docs/features/design-system.md` records the final tokens.

---

## Implementation

```text
app/globals.css
app/layout.tsx
components/home/
```
