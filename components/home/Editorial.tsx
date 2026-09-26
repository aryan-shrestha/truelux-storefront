import { ArrowRightIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { SectionHeading } from "@/components/layout/SectionHeading";
import { Button } from "@/components/ui/button";

export function Editorial({ href }: { href: string }) {
  return (
    <section
      aria-labelledby="editorial-heading"
      className="mx-auto grid w-full max-w-page items-center gap-10 px-4 md:grid-cols-[45fr_55fr] md:gap-0 md:px-20"
    >
      <div className="relative aspect-[562/530]">
        <Image
          src="/art/editorial.svg"
          alt=""
          fill
          sizes="(min-width: 768px) 45vw, 100vw"
          className="object-cover"
        />
      </div>
      <div className="flex flex-col items-start gap-8 md:pl-29 lg:pr-12">
        <SectionHeading
          id="editorial-heading"
          eyebrow="Shop by skin type"
          title="Care matched to how your skin behaves"
          description="Normal, dry, oily, combination, sensitive or mature: every skincare product lists the skin it suits, and the whole shop filters by it."
        />
        <Button asChild variant="outline" size="cta">
          <Link href={href}>
            Discover more
            <ArrowRightIcon data-icon="inline-end" aria-hidden />
          </Link>
        </Button>
      </div>
    </section>
  );
}
