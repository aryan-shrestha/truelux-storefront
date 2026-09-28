import type { ProductVariant, ShadeRef, SizeRef } from "@/lib/api/types";

// Variants are a sparse set of pairings, not a grid: every state is derived from
// the list itself. "sold-out" may come back; "not-made" never existed.
export type OptionState = "available" | "sold-out" | "not-made";

type OptionFlags = { state: OptionState; onSale: boolean };

export type SizeOption = SizeRef & OptionFlags;
export type ShadeOption = ShadeRef & OptionFlags;

function distinctBySlug<T extends { slug: string }>(refs: T[]): T[] {
  const seen = new Map<string, T>();
  for (const ref of refs) {
    if (!seen.has(ref.slug)) seen.set(ref.slug, ref);
  }
  return [...seen.values()];
}

function flagsOf(matching: ProductVariant[]): OptionFlags {
  const onSale = matching.some((variant) => variant.sale !== null);
  if (matching.length === 0) return { state: "not-made", onSale };
  return { state: matching.some((variant) => variant.inStock) ? "available" : "sold-out", onSale };
}

export function hasShades(variants: ProductVariant[]): boolean {
  return variants.some((variant) => variant.shade !== null);
}

export function sizeOptions(variants: ProductVariant[], shade: string | null): SizeOption[] {
  return distinctBySlug(variants.map((variant) => variant.size)).map((size) => {
    const matching = variants.filter(
      (variant) =>
        variant.size.slug === size.slug && (shade === null || variant.shade?.slug === shade),
    );
    return { ...size, ...flagsOf(matching) };
  });
}

export function shadeOptions(variants: ProductVariant[], size: string | null): ShadeOption[] {
  const shades = variants.flatMap((variant) => (variant.shade === null ? [] : [variant.shade]));
  return distinctBySlug(shades).map((shade) => {
    const matching = variants.filter(
      (variant) =>
        variant.shade?.slug === shade.slug && (size === null || variant.size.slug === size),
    );
    return { ...shade, ...flagsOf(matching) };
  });
}

export function findVariant(
  variants: ProductVariant[],
  size: string | null,
  shade: string | null,
): ProductVariant | undefined {
  if (size === null) return undefined;
  if (hasShades(variants) && shade === null) return undefined;
  return variants.find(
    (variant) => variant.size.slug === size && (variant.shade?.slug ?? null) === shade,
  );
}

export function statusOf({ state, onSale }: OptionFlags): string | undefined {
  if (state === "sold-out") return "Sold out";
  if (state === "not-made") return "Not available in this combination";
  return onSale ? "On sale" : undefined;
}

export function isEntirelySoldOut(variants: ProductVariant[]): boolean {
  return variants.length > 0 && variants.every((variant) => !variant.inStock);
}

/** A group of one is a decision already made. */
export function onlyOption(options: Array<{ slug: string }>): string | null {
  const [first] = options;
  return options.length === 1 && first !== undefined ? first.slug : null;
}

export function describeVariant(size: string, shade: string | null): string {
  return shade === null ? size : `${size} · ${shade}`;
}
