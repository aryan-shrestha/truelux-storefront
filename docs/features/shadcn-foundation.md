# shadcn foundation

Status: Planned

Last updated: 2026-09-25

---

## Goal

Make shadcn/ui the storefront's only component library (ADR 0009), themed to
TrueLux, and replace the hand-built primitives the fork inherited.

---

## Scope

What is included in this implementation?

- `shadcn init` (Radix base, CSS variables, Tailwind v4), with `components.json`
  committed
- Theme tokens in `app/globals.css` as shadcn variables (`--background`,
  `--foreground`, `--primary`, `--accent`, `--muted`, `--border`, `--ring`,
  `--radius`, chart colours), in light and dark, expressing the TrueLux direction
  (ADR 0010)
- The inherited `components/ui/*` replaced by shadcn components:
  - Button → `button`
  - Dialog → `dialog`
  - Sheet → `sheet`
  - Combobox → `command` + `popover`
  - Radio → `radio-group`
  - Skeleton → `skeleton`
  - Spinner → `spinner` (or `lucide-react` `Loader2` inside `button`)
  - Field → `form` + `input` + `label`
  - Quantity → `button-group` or `input` with buttons
- Further components added as features need them: `toggle-group`, `checkbox`,
  `carousel`, `badge`, `card`, `separator`, `pagination`, `sonner`,
  `navigation-menu`, `accordion`, `breadcrumb`
- `Price` stays, as the one place money is formatted, and is built from shadcn
  typography primitives or plain text
- Existing tests keep passing, updated for the new markup

What is explicitly outside the scope?

- Storybook or a component gallery

---

## Planned

- Components live in `components/ui/` exactly as shadcn generates them. Brand
  customisation (variants, sizes, radii) is edited **inside** those files or in the
  theme, never by restyling at the call site with long ad-hoc class lists.
- No other UI kit. Radix is used only through shadcn components.
- Feature components (`components/catalog`, `cart`, `checkout`, …) compose the
  primitives.
