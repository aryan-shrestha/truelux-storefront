import { ProductRail } from "@/components/catalog/ProductRail";
import type { Product } from "@/lib/api/types";
import { categoryHref } from "@/lib/catalog/navigation";
import { relatedProducts } from "@/lib/catalog/rails";

export async function RelatedProducts({ product }: { product: Product }) {
  const products = await relatedProducts(product);

  return (
    <ProductRail
      id="related"
      eyebrow="Suggested"
      title="Combine with"
      description={`More from ${product.category.name.toLowerCase()}, across every brand.`}
      products={products}
      more={{
        href: categoryHref(product.category.slug),
        label: `All ${product.category.name.toLowerCase()}`,
      }}
    />
  );
}
