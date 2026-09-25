import type { ProductVariant } from "@/lib/api/types";

/**
 * The variant list is a **sparse set of pairings, not a grid**.
 *
 * A product in three sizes and two colours may have four variants: the merchant
 * creates the combinations that exist. So every state here is derived from the
 * list itself, never from independent size and colour lists — a picker built
 * from the cartesian product offers combinations that were never made.
 *
 * Three states, and the last two are different facts:
 *
 * - `available`  — the pairing exists and has stock
 * - `sold-out`   — the pairing exists, `in_stock` is false. It may come back
 * - `not-made`   — no such pairing. It never existed and is not coming back
 *
 * Collapsing the last two into one greyed square tells a customer that a size
 * might return when it was never offered.
 */

export type OptionState = "available" | "sold-out" | "not-made";

export type VariantOption = {
  slug: string;
  name: string;
  state: OptionState;
};

/** Distinct sizes, in the order the API returned them (by the merchant's sort order). */
export function sizesOf(variants: ProductVariant[]): Array<{ slug: string; name: string }> {
  return distinct(variants.map((variant) => variant.size));
}

export function colorsOf(variants: ProductVariant[]): Array<{ slug: string; name: string }> {
  return distinct(variants.map((variant) => variant.color));
}

function distinct(
  refs: Array<{ slug: string; name: string }>,
): Array<{ slug: string; name: string }> {
  const seen = new Map<string, { slug: string; name: string }>();
  for (const ref of refs) {
    if (!seen.has(ref.slug)) seen.set(ref.slug, { slug: ref.slug, name: ref.name });
  }
  return [...seen.values()];
}

export function findVariant(
  variants: ProductVariant[],
  size: string | null,
  color: string | null,
): ProductVariant | undefined {
  if (size === null || color === null) return undefined;
  return variants.find((variant) => variant.size.slug === size && variant.color.slug === color);
}

/**
 * The state of each size, given whatever colour is currently chosen.
 *
 * With no colour chosen a size is available when *any* of its pairings has
 * stock — the customer has not yet narrowed it, so the question is whether this
 * size is buyable at all.
 */
export function sizeOptions(variants: ProductVariant[], color: string | null): VariantOption[] {
  return sizesOf(variants).map(({ slug, name }) => {
    const matching =
      color === null
        ? variants.filter((variant) => variant.size.slug === slug)
        : variants.filter((variant) => variant.size.slug === slug && variant.color.slug === color);

    return { slug, name, state: stateOf(matching) };
  });
}

export function colorOptions(variants: ProductVariant[], size: string | null): VariantOption[] {
  return colorsOf(variants).map(({ slug, name }) => {
    const matching =
      size === null
        ? variants.filter((variant) => variant.color.slug === slug)
        : variants.filter((variant) => variant.color.slug === slug && variant.size.slug === size);

    return { slug, name, state: stateOf(matching) };
  });
}

function stateOf(matching: ProductVariant[]): OptionState {
  if (matching.length === 0) return "not-made";
  return matching.some((variant) => variant.inStock) ? "available" : "sold-out";
}

/**
 * The words shown beneath an unavailable option. Undefined means available, so
 * nothing is shown.
 *
 * They are deliberately different: "sold out" may come back, "not made" never
 * existed, and a customer waiting for a restock deserves to know which one they
 * are looking at.
 */
export function statusOf(state: OptionState): string | undefined {
  if (state === "sold-out") return "Sold out";
  if (state === "not-made") return "Not made";
  return undefined;
}

/** True when no pairing anywhere has stock — the whole product is gone. */
export function isEntirelySoldOut(variants: ProductVariant[]): boolean {
  return variants.length > 0 && variants.every((variant) => !variant.inStock);
}

/**
 * The option to preselect: a group of one is a decision already made, so the
 * customer should not have to make it. Returns null when there is a real choice.
 */
export function onlyOption(options: VariantOption[]): string | null {
  const first = options[0];
  return options.length === 1 && first !== undefined ? first.slug : null;
}
