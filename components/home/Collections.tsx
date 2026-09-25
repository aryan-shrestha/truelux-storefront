import Link from "next/link";

import { ProductCard } from "@/components/catalog/ProductCard";
import { RevealLines } from "@/components/home/RevealLines";
import { Chevron } from "@/components/ui/Chevron";
import type { Category, ProductSummary } from "@/lib/api/types";
import { env } from "@/lib/env";

/**
 * The design's filterable collection, built from links rather than state: each
 * tab and sort goes to the listing, which already owns filtering and ordering
 * in the URL (ADR 0004). Filtering here would put a second listing, and a new
 * set of cache keys, on the home page.
 */
export function Collections({
  products,
  categories,
}: {
  products: ProductSummary[];
  categories: Category[];
}) {
  return (
    <section aria-labelledby="collections-title" className="mt-24 md:mt-[115px]">
      <h2
        id="collections-title"
        className="font-display text-poster font-black break-words uppercase"
      >
        <RevealLines lines={[env.brandName, "Collections", "23-24"]} />
      </h2>

      <div className="border-line mt-7 flex flex-wrap items-end justify-between gap-x-10 gap-y-6 border-b pb-3">
        <ul className="font-utility flex flex-wrap gap-x-10 gap-y-2 text-[1.0625rem]">
          <li>
            <Link href="/products" className="uppercase">
              (All)
            </Link>
          </li>
          {categories.map((category) => (
            <li key={category.slug}>
              <Link
                href={`/products?category=${category.slug}`}
                className="text-mute hover:text-ink transition-colors duration-300"
              >
                {category.name}
              </Link>
            </li>
          ))}
        </ul>

        <div className="font-utility flex gap-[110px] text-[0.9375rem]">
          <Link href="/products" className="group hover:text-slate self-start transition-colors">
            Filters(
            <span className="inline-block transition-transform duration-500 ease-(--ease-settle) group-hover:rotate-90">
              +
            </span>
            )
          </Link>
          <div>
            <p>Sorts(-)</p>
            <ul className="text-slate mt-1.5 text-right leading-5">
              <li>
                <Link
                  href="/products?ordering=base_price"
                  className="hover:text-ink transition-colors"
                >
                  <span className="sr-only">Price, </span>Less to more
                </Link>
              </li>
              <li>
                <Link
                  href="/products?ordering=-base_price"
                  className="hover:text-ink transition-colors"
                >
                  <span className="sr-only">Price, </span>More to Less
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <ul className="mt-[37px] grid gap-x-[42px] gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <li key={product.id}>
            <ProductCard
              product={product}
              sizes="(min-width: 1024px) 29vw, (min-width: 640px) 50vw, 100vw"
            />
          </li>
        ))}
      </ul>

      <Link
        href="/products"
        className="group font-utility text-mute hover:text-ink mx-auto mt-10 flex w-fit flex-col items-center gap-1 text-[1.1875rem] transition-colors"
      >
        More
        <Chevron
          direction="down"
          className="text-ink transition-transform duration-500 ease-(--ease-settle) group-hover:translate-y-1"
        />
      </Link>
    </section>
  );
}
