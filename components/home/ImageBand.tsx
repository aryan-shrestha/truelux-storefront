import { ArrowRightIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export function ImageBand() {
  return (
    <section aria-labelledby="authentic-heading" className="relative text-on-image">
      <Image src="/art/band.svg" alt="" fill sizes="100vw" className="object-cover" />
      <div className="relative mx-auto flex min-h-[30rem] max-w-page flex-col justify-center px-4 py-16 md:min-h-[37rem] md:px-23">
        <div className="flex max-w-xl flex-col items-start gap-5">
          <p className="text-sm">Authentic, always</p>
          <h2 id="authentic-heading" className="text-display">
            Every product, straight from the brand
          </h2>
          <p className="text-lg leading-relaxed">
            We stock each brand directly, so what arrives at your door is exactly what the brand
            made. Browse a brand&apos;s full range, then pay in cash when your order reaches you.
          </p>
          <Button asChild variant="overlay" size="cta" className="mt-3">
            <Link href="/brands">
              Discover more
              <ArrowRightIcon data-icon="inline-end" aria-hidden />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
