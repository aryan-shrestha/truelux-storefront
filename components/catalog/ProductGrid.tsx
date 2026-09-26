import { ProductCard } from "@/components/catalog/ProductCard";
import type { ProductSummary } from "@/lib/api/types";

const ABOVE_THE_FOLD = 4;

export function ProductGrid({ products }: { products: ProductSummary[] }) {
  return (
    <ul className="grid grid-cols-2 gap-x-2 gap-y-12 md:grid-cols-3 md:gap-x-0.5 md:gap-y-16 lg:grid-cols-4">
      {products.map((product, index) => (
        <li key={product.id}>
          <ProductCard product={product} priority={index < ABOVE_THE_FOLD} />
        </li>
      ))}
    </ul>
  );
}
