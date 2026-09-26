# ADR 0011: The storefront follows the supplied design

Status: Accepted

Date: 2026-09-26

Supersedes: [ADR 0010](0010-the-truelux-visual-direction.md)

---

## Context

The owner supplied mockups (`docs/design/`) for the landing page, product listing,
product detail and navigation after the first TrueLux direction had been
implemented.

---

## Decision

The storefront follows the mockups for layout, palette, typography and components,
using TrueLux branding and data. Features the mockups show that TrueLux does not have
(wishlist, accounts, language, click and collect, newsletter) are left out rather
than faked.

---

## Reason

The mockups are the client-facing design. Faked features would mislead the demo
audience.

---

## Consequences

### Constraints introduced

- `docs/features/design-alignment.md` is the reference. Any deviation from a mockup
  is recorded there.

---

## Implementation

```text
app/globals.css
components/layout/
components/home/
components/catalog/
```
