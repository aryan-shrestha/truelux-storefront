# ADR 0012: The storefront is light only

Status: Accepted

Date: 2026-09-26

Supersedes: the dark-mode decision in `docs/features/design-system.md`

---

## Context

The storefront followed `prefers-color-scheme`, so visitors whose operating system
is dark saw a near-black shop. The supplied mockups
([ADR 0011](0011-the-storefront-follows-the-supplied-design.md)) have no dark
mode, and the owner wants the shop to look as designed for everyone.

---

## Decision

The storefront has one theme, light. `app/globals.css` defines no dark palette,
`:root` sets `color-scheme: light`, and no component carries a `dark:` utility.

---

## Reason

Tailwind v4's built-in `dark` variant follows the operating system even without a
`@custom-variant`, so removing the dark palette alone would leave shadcn's `dark:`
utilities half-applying on dark systems. Removing both is the only way to render
the design unchanged everywhere.

---

## Consequences

### Constraints introduced

- A newly added shadcn component arrives with `dark:` classes. Strip them before
  committing.

---

## Implementation

```text
app/globals.css
components/ui/
```
