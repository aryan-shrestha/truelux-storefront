import { ArrowRightIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { SectionHeading } from "@/components/layout/SectionHeading";
import { Button } from "@/components/ui/button";
import type { Brand } from "@/lib/api/types";

const SHOWN = 6;

export function BrandGrid({ brands }: { brands: Brand[] }) {
  if (brands.length === 0) return null;

  return (
    <section aria-labelledby="brands-heading" className="bg-muted px-4 py-20 md:py-24">
      <SectionHeading id="brands-heading" title="Our brands" align="center" />
      <ul className="mx-auto mt-10 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-3">
        {brands.slice(0, SHOWN).map((brand) => (
          <li key={brand.slug}>
            <Link
              href={`/brands/${brand.slug}`}
              className="group bg-background hover:bg-secondary relative flex aspect-square flex-col items-center justify-center gap-2 p-4 text-center transition-colors"
            >
              {brand.logoUrl === null ? (
                <span className="font-heading text-2xl md:text-3xl">{brand.name}</span>
              ) : (
                <>
                  <span className="relative h-1/3 w-2/3">
                    <Image
                      src={brand.logoUrl}
                      alt=""
                      fill
                      sizes="160px"
                      className="object-contain"
                    />
                  </span>
                  <span className="text-sm">{brand.name}</span>
                </>
              )}
              <span className="text-muted-foreground text-xs">
                {brand.productCount === 1 ? "1 product" : `${brand.productCount} products`}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-10 flex justify-center">
        <Button asChild variant="outline" size="cta">
          <Link href="/brands">
            All brands
            <ArrowRightIcon data-icon="inline-end" aria-hidden />
          </Link>
        </Button>
      </div>
    </section>
  );
}
