import { ArrowRightIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { SectionHeading } from "@/components/layout/SectionHeading";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselProgress,
} from "@/components/ui/carousel";

// There are no article pages, so each note is complete here and ends in a search
// rather than a "read more" to nowhere. Searches never 400, unlike a guessed slug.
const NOTES = [
  {
    art: "/art/journal-1.svg",
    topic: "Sun care",
    title: "Mineral or chemical sunscreen?",
    body: "Mineral filters sit on the skin and reflect light; chemical filters absorb it. Both protect when you use enough and reapply.",
    link: { href: "/products?search=spf", label: "Shop sunscreen" },
  },
  {
    art: "/art/journal-2.svg",
    topic: "Seasons",
    title: "Caring for skin through a Kathmandu winter",
    body: "Cold, dry air pulls water from the skin. Layer a hydrating serum under a richer cream and keep cleansing gentle.",
    link: { href: "/products?search=serum", label: "Shop serums" },
  },
  {
    art: "/art/journal-3.svg",
    topic: "Makeup",
    title: "Finding your foundation shade",
    body: "Test on the jawline in daylight. When two shades are close, the right one is the one that disappears.",
    link: { href: "/products?search=foundation", label: "Shop foundation" },
  },
  {
    art: "/art/journal-4.svg",
    topic: "Routine",
    title: "A routine in four steps",
    body: "Cleanse, treat, moisturise and, by day, protect. Four steps cover most of what skin needs.",
    link: { href: "/products?search=cleans", label: "Shop cleansers" },
  },
];

// The header's Journal link lands here.
export function Journal() {
  return (
    <section
      id="journal"
      aria-labelledby="journal-heading"
      className="max-w-page mx-auto w-full scroll-mt-(--header-offset) px-4 md:px-8"
    >
      <SectionHeading id="journal-heading" eyebrow="Notes on skin and care" title="Our journal" />
      <Carousel opts={{ align: "start" }} aria-label="Journal notes" className="mt-10">
        <CarouselContent className="-ml-1">
          {NOTES.map((note) => (
            <CarouselItem key={note.title} className="basis-4/5 pl-1 sm:basis-1/2 lg:basis-1/4">
              <article className="flex h-full flex-col gap-3">
                <div className="relative mb-6 aspect-[332/288]">
                  <Image
                    src={note.art}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 80vw"
                    className="object-cover"
                  />
                </div>
                <p className="text-muted-foreground text-sm uppercase">{note.topic}</p>
                <h3 className="font-semibold">{note.title}</h3>
                <p className="text-sm leading-relaxed">{note.body}</p>
                <Button asChild variant="link" size="inline" className="mt-auto self-start pt-4">
                  <Link href={note.link.href}>
                    {note.link.label}
                    <ArrowRightIcon data-icon="inline-end" aria-hidden />
                  </Link>
                </Button>
              </article>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselProgress className="mt-10" />
      </Carousel>
    </section>
  );
}
