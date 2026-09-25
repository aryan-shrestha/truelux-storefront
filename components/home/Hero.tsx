import { cn } from "cn";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";

// The foundation range from porcelain to deep, as tokens: the one decorative
// flourish on the page, and the thing a cosmetics shopper recognises first.
const SHADE_RIBBON = [
  "bg-shade-1",
  "bg-shade-2",
  "bg-shade-3",
  "bg-shade-4",
  "bg-shade-5",
  "bg-shade-6",
  "bg-shade-7",
  "bg-shade-8",
];

export function Hero() {
  return (
    <section className="grid items-center gap-10 md:grid-cols-[1.1fr_1fr] md:gap-16">
      <div className="flex flex-col gap-8">
        <h1 className="text-display">Beauty you can trust, delivered to your door.</h1>
        <p className="max-w-md text-lg leading-relaxed text-muted-foreground">
          Authentic skincare, makeup and fragrance from the brands you love. Pay in cash when your
          order arrives, anywhere in Nepal.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href="/products?ordering=-created_at">Shop new arrivals</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/brands">Browse brands</Link>
          </Button>
        </div>
        <ul aria-hidden className="flex max-w-sm">
          {SHADE_RIBBON.map((shade) => (
            <li key={shade} className={cn("h-3 flex-1 first:rounded-l-full last:rounded-r-full", shade)} />
          ))}
        </ul>
      </div>

      <div className="relative aspect-4/5 overflow-hidden rounded-3xl bg-muted">
        <Image
          src="/home/hero.svg"
          alt=""
          fill
          priority
          sizes="(min-width: 768px) 45vw, 100vw"
          className="object-cover"
        />
      </div>
    </section>
  );
}
