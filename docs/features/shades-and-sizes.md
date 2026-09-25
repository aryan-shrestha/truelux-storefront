# Shades and sizes

Status: Planned

Last updated: 2026-09-25

---

## Goal

Let shoppers see and pick shades as colour swatches, choose a size, and filter the
catalogue by both. Products without shades must look deliberate, not broken.

---

## Scope

What is included in this implementation?

- `VariantPicker`: shade swatches (a round button filled with `hex_code`, the shade
  name as its accessible name and visible on selection), and size choices. Built on
  shadcn `ToggleGroup`.
- A product whose variants all have `shade: null` shows the size picker only. A
  product with a single variant shows neither picker and adds that variant.
- Out-of-stock combinations stay visible but are disabled, with a strikethrough.
- `FilterRail`: a **Shade** group (swatches from `GET /api/v1/shades/`) and a
  **Size** group (from `GET /api/v1/sizes/`). This closes the gap the old
  `FilterRail` comment recorded, where the API had no such endpoints.
- Cart lines and the order summary show `Size · Shade`, or size alone.
- Every `color` reference becomes `shade`.

What is explicitly outside the scope?

- Shade finder or quiz
- Per-shade product images

---

## Context

Backend contract: `docs/features/shades-and-sizes.md` in the back-end repo. The
variant payload is `shade: { name, slug, hex_code } | null`.

---

## Tests

To be written:

- Picking a shade and a size resolves the right variant id.
- Shadeless products render no shade group.
- A single-variant product needs no selection.
- An out-of-stock combination is disabled.
- Filter links carry `?shade=` and `?size=`.
