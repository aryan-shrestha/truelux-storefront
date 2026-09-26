import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Price } from "@/components/ui/price";
import type { ProductSummary } from "@/lib/api/types";

const SIZES = "(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw";

type ProductCardProps = {
  product: ProductSummary;
  priority?: boolean;
};

export function ProductCard({ product, priority = false }: ProductCardProps) {
  const image = product.primaryImage;

  return (
    // The product link stretches over the card; the brand link sits above it,
    // because one anchor cannot contain another.
    <article className="group relative flex flex-col gap-5 pb-4 text-center">
      <div className="bg-muted relative aspect-4/5 overflow-hidden">
        {image !== null && (
          <Image
            src={image.url}
            alt={image.altText}
            fill
            sizes={SIZES}
            priority={priority}
            className="object-cover transition-transform duration-700 ease-(--ease-settle) group-hover:scale-[1.03]"
          />
        )}
        {!product.inStock && (
          <Badge variant="label" className="absolute top-4 right-4">
            Sold out
          </Badge>
        )}
      </div>

      <div className="flex flex-col items-center gap-1.5 px-2">
        <h3 className="text-[0.9375rem] font-semibold">
          <Link href={`/products/${product.slug}`} className="after:absolute after:inset-0">
            {product.name}
          </Link>
        </h3>
        <Link
          href={`/brands/${product.brand.slug}`}
          className="text-muted-foreground hover:text-foreground relative z-10 text-sm hover:underline"
        >
          {product.brand.name}
        </Link>
        <Price amount={product.basePrice} className="mt-3 text-[0.9375rem]" />
      </div>
    </article>
  );
}
