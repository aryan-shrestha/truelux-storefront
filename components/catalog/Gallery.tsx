"use client";

import { cn } from "cn";
import Image from "next/image";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import type { ProductImage } from "@/lib/api/types";

export function Gallery({ images, name }: { images: ProductImage[]; name: string }) {
  const [api, setApi] = useState<CarouselApi>();
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (!api) return;
    const handleSelect = () => setActive(api.selectedScrollSnap());
    api.on("select", handleSelect);
    return () => {
      api.off("select", handleSelect);
    };
  }, [api]);

  if (images.length === 0) {
    return (
      <div className="bg-muted flex aspect-9/10 items-center justify-center">
        <p className="text-muted-foreground text-sm">No photographs of {name} yet</p>
      </div>
    );
  }

  const count = images.length;

  return (
    <div className="flex flex-col gap-3">
      <Carousel setApi={setApi} aria-label={`Photographs of ${name}`} className="group/gallery">
        <CarouselContent>
          {images.map((image, index) => (
            <CarouselItem
              key={image.url}
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${count}`}
            >
              <div className="bg-muted relative aspect-9/10 overflow-hidden">
                <Image
                  src={image.url}
                  alt={image.altText}
                  fill
                  sizes="(min-width: 768px) 70vw, 100vw"
                  // Only the first: several priorities slow the one that is the LCP.
                  priority={index === 0}
                  className="object-cover"
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        {count > 1 && (
          <>
            <CarouselPrevious aria-label="Previous photograph" className="left-3" />
            <CarouselNext aria-label="Next photograph" className="right-3" />
          </>
        )}
      </Carousel>

      {count > 1 && (
        <ul aria-label="Choose a photograph" className="flex gap-2 overflow-x-auto px-4 md:px-8">
          {images.map((image, index) => (
            <li key={image.url} className="shrink-0">
              <Button
                variant="outline"
                aria-label={`Show photograph ${index + 1} of ${count}`}
                aria-current={index === active ? "true" : undefined}
                onClick={() => api?.scrollTo(index)}
                className={cn(
                  "relative aspect-9/10 h-auto w-16 overflow-hidden p-0",
                  index === active ? "border-foreground" : "opacity-60 hover:opacity-100",
                )}
              >
                <Image src={image.url} alt="" fill sizes="64px" className="object-cover" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
