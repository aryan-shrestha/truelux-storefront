import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { ProductCard } from "@/components/catalog/ProductCard";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  CarouselProgress,
} from "@/components/ui/carousel";
import type { ProductSummary } from "@/lib/api/types";

type ProductRailProps = {
  id: string;
  eyebrow?: ReactNode;
  title: string;
  description?: ReactNode;
  products: ProductSummary[];
  more: { href: string; label: string };
};

export function ProductRail({ id, eyebrow, title, description, products, more }: ProductRailProps) {
  if (products.length === 0) return null;
  const headingId = `${id}-heading`;

  return (
    <section aria-labelledby={headingId} className="max-w-page mx-auto w-full px-4 md:px-8">
      <SectionHeading id={headingId} eyebrow={eyebrow} title={title} description={description} />
      <Carousel opts={{ align: "start" }} aria-label={`${title}: products`} className="mt-10">
        <CarouselContent className="-ml-2 md:-ml-0.5">
          {products.map((product) => (
            <CarouselItem
              key={product.id}
              className="basis-1/2 pl-2 md:basis-1/3 md:pl-0.5 lg:basis-1/4"
            >
              <ProductCard product={product} />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselProgress className="mt-8" />
        <div className="mt-8 flex items-center justify-between gap-4">
          <Button asChild variant="link" size="inline">
            <Link href={more.href}>
              {more.label}
              <ArrowRightIcon data-icon="inline-end" aria-hidden />
            </Link>
          </Button>
          <div className="flex gap-2">
            <CarouselPrevious variant="ghost" className="static translate-none" />
            <CarouselNext variant="ghost" className="static translate-none" />
          </div>
        </div>
      </Carousel>
    </section>
  );
}
