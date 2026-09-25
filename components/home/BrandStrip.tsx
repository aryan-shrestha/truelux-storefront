import Link from "next/link";

import { Button } from "@/components/ui/button";
import type { Brand } from "@/lib/api/types";

export function BrandStrip({ brands }: { brands: Brand[] }) {
  if (brands.length === 0) return null;

  return (
    <section
      aria-labelledby="brands-heading"
      className="flex flex-col gap-8 border-y border-gold/40 py-12"
    >
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="brands-heading" className="text-title">
          Our brands
        </h2>
        <Button asChild variant="link">
          <Link href="/brands">All brands</Link>
        </Button>
      </div>
      <ul className="flex flex-wrap items-center gap-x-12 gap-y-6">
        {brands.map((brand) => (
          <li key={brand.slug}>
            <Link
              href={`/brands/${brand.slug}`}
              className="font-heading text-3xl text-muted-foreground transition-colors hover:text-foreground"
            >
              {brand.name}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
