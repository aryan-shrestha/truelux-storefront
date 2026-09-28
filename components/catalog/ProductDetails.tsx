import type { Product } from "@/lib/api/types";

// Each row is optional in the API; an empty one is left out rather than shown blank.
export function ProductDetails({ product }: { product: Product }) {
  const rows = [
    { label: "Suited to", value: product.skinTypes.map((skinType) => skinType.name).join(", ") },
    { label: "Skin feel", value: product.skinFeel.trim() },
    { label: "Key ingredients", value: product.keyIngredients.trim() },
  ].filter((row) => row.value !== "");

  if (rows.length === 0) return null;

  return (
    <dl className="border-foreground border-t">
      {rows.map((row) => (
        <div key={row.label} className="py-fit-5 flex flex-col gap-1.5 border-b">
          <dt className="text-sm font-semibold">{row.label}</dt>
          <dd className="text-muted-foreground text-sm leading-relaxed">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}
