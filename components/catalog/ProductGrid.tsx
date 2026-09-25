import { ProductCard } from "@/components/catalog/ProductCard";
import type { ProductSummary } from "@/lib/api/types";

const ABOVE_THE_FOLD = 4;

export function ProductGrid({ products }: { products: ProductSummary[] }) {
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-6 xl:grid-cols-4">
      {products.map((product, index) => (
        <li key={product.id}>
          <ProductCard product={product} priority={index < ABOVE_THE_FOLD} />
        </li>
      ))}
    </ul>
  );
}
