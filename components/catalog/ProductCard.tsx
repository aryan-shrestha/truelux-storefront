import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Price } from "@/components/ui/price";
import type { ProductSummary } from "@/lib/api/types";

const SIZES = "(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw";

type ProductCardProps = {
  product: ProductSummary;
  priority?: boolean;
};

export function ProductCard({ product, priority = false }: ProductCardProps) {
  const image = product.primaryImage;

  return (
    // The product link stretches over the tile; the brand link sits above it,
    // because one anchor cannot contain another.
    <article className="group relative flex flex-col gap-3">
      <div className="relative aspect-4/5 overflow-hidden rounded-xl bg-muted">
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
          <Badge variant="secondary" className="absolute top-3 left-3">
            Sold out
          </Badge>
        )}
      </div>

      <div className="flex flex-col gap-0.5">
        <Link
          href={`/brands/${product.brand.slug}`}
          className="relative z-10 w-fit text-xs tracking-wide text-muted-foreground hover:text-foreground"
        >
          {product.brand.name}
        </Link>
        <h3 className="font-sans text-sm font-medium">
          <Link href={`/products/${product.slug}`} className="after:absolute after:inset-0">
            {product.name}
          </Link>
        </h3>
        <Price amount={product.basePrice} className="text-sm text-muted-foreground" />
      </div>
    </article>
  );
}
