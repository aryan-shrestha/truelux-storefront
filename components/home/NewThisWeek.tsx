import Link from "next/link";

import { ProductCard } from "@/components/catalog/ProductCard";
import { RailControls } from "@/components/home/RailControls";
import { RevealLines } from "@/components/home/RevealLines";
import type { ProductSummary } from "@/lib/api/types";

export function NewThisWeek({ products }: { products: ProductSummary[] }) {
  return (
    <section aria-labelledby="latest-title" className="mt-24 md:mt-[148px]">
      <div className="flex items-end justify-between gap-4">
        <h2 id="latest-title" className="font-display text-poster font-black uppercase">
          <RevealLines
            lines={["New", "this week"]}
            trailing={
              <span className="font-utility text-indigo relative -top-[0.9em] ml-0.5 text-[1.125rem] font-bold tracking-[0.05em]">
                ({products.length})
              </span>
            }
          />
        </h2>
        <Link
          href="/products?ordering=-created_at"
          className="font-utility text-slate hover:text-ink shrink-0 text-[0.9375rem] transition-colors"
        >
          See All
        </Link>
      </div>

      {/* Runs to the viewport's right edge, as the design's fourth tile does. */}
      <ul
        id="latest-rail"
        className="mt-[30px] -mr-4 flex snap-x snap-mandatory [scrollbar-width:none] gap-[42px] overflow-x-auto scroll-smooth pr-4 md:-mr-[50px] md:pr-[50px] [&::-webkit-scrollbar]:hidden"
      >
        {products.map((product) => (
          // The collection grid's column width exactly: percentages resolve
          // against the content box, which the bleed's padding does not widen.
          <li
            key={product.id}
            className="w-[70vw] shrink-0 snap-start sm:w-[calc((100%-42px)/2)] lg:w-[calc((100%-84px)/3)]"
          >
            <ProductCard
              product={product}
              sizes="(min-width: 1024px) 29vw, (min-width: 640px) 50vw, 70vw"
            />
          </li>
        ))}
      </ul>

      <RailControls target="latest-rail" className="mt-[30px] justify-center" />
    </section>
  );
}
