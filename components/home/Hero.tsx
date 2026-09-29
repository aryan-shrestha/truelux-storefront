import { ArrowRightIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselDots, CarouselItem } from "@/components/ui/carousel";

const SLIDES = [
  {
    art: "/images/hero-1.jpg",
    eyebrow: "Skincare, makeup and fragrance",
    title: "Beauty you can trust, delivered to your door",
    body: "Authentic products from the brands you love, sent anywhere in Nepal. Pay in cash when your order arrives.",
    href: "/products",
  },
  {
    art: "/images/hero-2.jpg",
    eyebrow: "Just in",
    title: "New on our shelves",
    body: "The latest arrivals from every brand we stock, as soon as they are published.",
    href: "/products?ordering=-created_at",
  },
  {
    art: "/images/hero-3.jpg",
    eyebrow: "Our brands",
    title: "Every product from the brand itself",
    body: "No grey imports and no guesswork: browse the full range of each brand we carry.",
    href: "/brands",
  },
];

export function Hero() {
  return (
    <Carousel opts={{ loop: true }} aria-label="Featured" className="text-on-image">
      <CarouselContent className="ml-0">
        {SLIDES.map((slide, index) => {
          const Title = index === 0 ? "h1" : "h2";
          return (
            <CarouselItem
              key={slide.href}
              aria-label={`${index + 1} of ${SLIDES.length}`}
              className="relative h-[34rem] pl-0 md:h-[46rem]"
            >
              <Image
                src={slide.art}
                alt=""
                fill
                priority={index === 0}
                sizes="100vw"
                className="object-cover"
              />
              <div className="from-scrim via-scrim/40 absolute inset-0 bg-linear-to-r to-transparent" />
              <div className="max-w-page relative mx-auto flex h-full flex-col justify-center px-4 md:px-15">
                <div className="flex max-w-md flex-col items-start gap-5">
                  <p className="text-sm">{slide.eyebrow}</p>
                  <Title className="text-display">{slide.title}</Title>
                  <p className="text-lg leading-relaxed">{slide.body}</p>
                  <Button asChild variant="overlay" size="cta" className="mt-3">
                    <Link href={slide.href}>
                      Discover more
                      <ArrowRightIcon data-icon="inline-end" aria-hidden />
                    </Link>
                  </Button>
                </div>
              </div>
            </CarouselItem>
          );
        })}
      </CarouselContent>
      <CarouselDots className="absolute inset-x-0 bottom-3" />
    </Carousel>
  );
}
