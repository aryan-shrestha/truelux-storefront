import { ProductRail } from "@/components/catalog/ProductRail";
import type { Category } from "@/lib/api/types";
import { categoryHref } from "@/lib/catalog/navigation";
import { categoryProducts } from "@/lib/catalog/rails";

export async function CategoryRail({ category }: { category: Category }) {
  const products = await categoryProducts(category.slug);
  const name = category.name.toLowerCase();

  return (
    <ProductRail
      id="featured-category"
      eyebrow={category.name}
      title={`The ${name} shelf`}
      description={`A selection from our ${name} range, across every brand.`}
      products={products}
      more={{ href: categoryHref(category.slug), label: `All ${name}` }}
    />
  );
}
