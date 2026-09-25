import { ProductCard } from "@/components/catalog/ProductCard";
import type { ProductSummary } from "@/lib/api/types";

/**
 * Uniform and comparable, unlike the home page's asymmetric rhythm.
 *
 * `design-system.md` explains the split: the home page sells and may be
 * irregular; the listing is for comparing garments, and a customer scanning for
 * a size is doing exactly that comparison. An irregular grid photographs better
 * and shops worse.
 */
export function ProductGrid({ products }: { products: ProductSummary[] }) {
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-6 xl:grid-cols-4">
      {products.map((product, index) => (
        <li key={product.id}>
          {/* Only the first row is above the fold. */}
          <ProductCard product={product} priority={index < 4} />
        </li>
      ))}
    </ul>
  );
}
