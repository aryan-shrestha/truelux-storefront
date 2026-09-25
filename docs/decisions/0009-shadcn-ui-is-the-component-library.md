# ADR 0009: shadcn/ui is the component library

Status: Accepted

Date: 2026-09-25

Supersedes: the primitive list in `docs/features/design-system.md`

---

## Context

The fork arrived with hand-built primitives in `components/ui/`. TrueLux has two
front-ends, the storefront and the admin, and the owner wants one component
vocabulary across both, maintained by a well-known library rather than bespoke code.

---

## Decision

Every UI primitive comes from shadcn/ui (`npx shadcn@latest add …`) into
`components/ui/`. No other component library is installed. The brand is applied
through shadcn's CSS variables in `app/globals.css` and by editing the generated
component files, not by restyling at call sites.

---

## Reason

The components are owned source, accessible (Radix underneath), themeable through
variables, and identical between the storefront and the admin.

---

## Alternatives considered

### Keep the hand-built primitives

Why it was not chosen: two apps would diverge, and every primitive would be
maintained twice.

---

## Consequences

### Positive

- One vocabulary across both apps, and accessible defaults.

### Negative

- Generated files must be reviewed when `shadcn` is upgraded.

### Constraints introduced

- A primitive not available in shadcn is composed from shadcn parts, not hand-rolled
  from scratch.

---

## Implementation

```text
components.json
components/ui/
app/globals.css
```
