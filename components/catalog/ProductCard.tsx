import Image from "next/image";
import Link from "next/link";

import { Price } from "@/components/ui/Price";
import type { ProductSummary } from "@/lib/api/types";

/**
 * The design's tile: the photograph in a 1px frame, then a two-line caption —
 * category above, name and price on one line below.
 */

const SIZES = "(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw";

export function ProductCard({
  product,
  priority = false,
  sizes = SIZES,
}: {
  product: ProductSummary;
  priority?: boolean;
  sizes?: string;
}) {
  const image = product.primaryImage;

  return (
    // One link around the whole tile: two links to the same place are noise in a
    // screen reader's link list.
    <Link href={`/products/${product.slug}`} className="group block">
      <div className="border-line bg-wash/40 relative aspect-[365/375] overflow-hidden border">
        {image === null ? (
          // A product with no photograph is a real state; the backend requires
          // none. The tile keeps its shape rather than collapsing.
          <span className="sr-only">No photograph yet</span>
        ) : (
          <Image
            src={image.url}
            // An empty alt_text means decorative. Substituting the product name
            // makes a screen reader announce the same phrase twice per tile.
            alt={image.altText}
            fill
            sizes={sizes}
            priority={priority}
            className="object-cover transition-transform duration-1000 ease-(--ease-settle) group-hover:scale-[1.04]"
          />
        )}
      </div>

      <div className="mt-[18px] flex flex-col gap-1">
        <span className="text-slate flex items-baseline gap-2 text-[0.8125rem]">
          {product.category.name}
          {/* A word, not a grey overlay: colour never carries meaning alone. */}
          {!product.inStock && <span className="text-ink font-medium">Sold out</span>}
        </span>
        <span className="flex items-baseline justify-between gap-4 text-[0.9375rem] font-medium">
          <span className="min-w-0">{product.name}</span>
          <Price amount={product.basePrice} className="shrink-0" />
        </span>
      </div>
    </Link>
  );
}
