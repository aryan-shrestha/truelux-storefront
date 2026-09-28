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
      <div className="bg-muted flex aspect-9/10 items-center justify-center md:landscape:aspect-auto md:landscape:h-[calc(100svh-5rem)] md:landscape:flex-1">
        <p className="text-muted-foreground text-sm">No photographs of {name} yet</p>
      </div>
    );
  }

  const count = images.length;

  return (
    <div className="flex gap-2 md:landscape:h-[calc(100svh-5rem)] md:landscape:max-w-[62%] md:landscape:shrink-0 md:landscape:gap-3">
      {/* The strip takes the photograph's height and scrolls, rather than setting it. */}
      <div className="relative w-16 shrink-0 md:w-21">
        <ul
          aria-label="Choose a photograph"
          className="absolute inset-0 flex flex-col gap-2 overflow-y-auto pl-2 md:pl-3"
        >
          {images.map((image, index) => (
            <li key={image.url} className="shrink-0">
              <Button
                variant="outline"
                aria-label={`Show photograph ${index + 1} of ${count}`}
                aria-current={index === active ? "true" : undefined}
                onClick={() => api?.scrollTo(index)}
                className={cn(
                  "relative aspect-9/10 h-auto w-full overflow-hidden p-0",
                  index === active ? "border-foreground" : "opacity-60 hover:opacity-100",
                )}
              >
                <Image src={image.url} alt="" fill sizes="72px" className="object-cover" />
              </Button>
            </li>
          ))}
        </ul>
      </div>

      <Carousel
        setApi={setApi}
        aria-label={`Photographs of ${name}`}
        className="min-w-0 flex-1 md:landscape:aspect-9/10 md:landscape:h-full md:landscape:flex-initial"
      >
        <CarouselContent className="md:landscape:h-full">
          {images.map((image, index) => (
            <CarouselItem
              key={image.url}
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${count}`}
            >
              <div className="bg-muted relative aspect-9/10 overflow-hidden md:landscape:aspect-auto md:landscape:h-full">
                <Image
                  src={image.url}
                  alt={image.altText}
                  fill
                  sizes="(min-width: 768px) and (orientation: landscape) 60vw, 85vw"
                  // Only the first: several priorities slow the one that is the LCP.
                  priority={index === 0}
                  className="object-cover"
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious
          variant="floating"
          size="icon"
          aria-label="Previous photograph"
          className="left-3"
        />
        <CarouselNext
          variant="floating"
          size="icon"
          aria-label="Next photograph"
          className="right-3"
        />
      </Carousel>
    </div>
  );
}
