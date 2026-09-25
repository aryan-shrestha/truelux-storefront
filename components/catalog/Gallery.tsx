"use client";

import clsx from "clsx";
import { motion } from "motion/react";
import Image from "next/image";
import { useRef, useState } from "react";

import { Chevron } from "@/components/ui/Chevron";
import type { ProductImage } from "@/lib/api/types";

/**
 * One photograph at a time, with the rest as thumbnails beside it.
 *
 * The main image is a scroll-snapping track rather than a swapped `src`, so a
 * phone swipes it, a trackpad flicks it and arrow keys step it with no
 * handler of ours. The thumbnails and buttons only ever scroll that track; the
 * active index is read back from where it came to rest.
 */
export function Gallery({ images, name }: { images: ProductImage[]; name: string }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    // The backend requires no image. The slot keeps the page's shape rather
    // than collapsing the layout around a missing photograph.
    return (
      <div className="border-line bg-wash/40 flex aspect-[4/5] items-center justify-center border lg:aspect-auto lg:h-full">
        <span className="text-detail text-slate">No photographs of {name} yet</span>
      </div>
    );
  }

  const count = images.length;

  function show(index: number) {
    const slide = trackRef.current?.children[index];
    if (!(slide instanceof HTMLElement)) return;
    // The slide's own offset, not index × width: widths are fractional and a
    // multiplied step drifts. No `behavior`: the track's CSS decides, so
    // reduced motion jumps.
    trackRef.current?.scrollTo({ left: slide.offsetLeft });
  }

  function handleTrackScroll() {
    const track = trackRef.current;
    if (!track || track.clientWidth === 0) return;
    // The gap between slides is 4px; against a slide's width it rounds away.
    setActive(Math.round(track.scrollLeft / track.clientWidth));
  }

  return (
    <div className="flex flex-col gap-3 lg:h-full lg:flex-row">
      {count > 1 && (
        <ul
          aria-label="Choose a photograph"
          className="lg:scroll-quiet order-2 flex [scrollbar-width:none] gap-2 overflow-x-auto lg:order-none lg:w-[76px] lg:shrink-0 lg:flex-col lg:overflow-x-hidden lg:pr-1"
        >
          {images.map((image, index) => (
            <li key={image.url} className="shrink-0">
              <button
                type="button"
                onClick={() => show(index)}
                aria-label={`Show photograph ${index + 1} of ${count}`}
                aria-current={index === active ? "true" : undefined}
                className={clsx(
                  "border-line relative block aspect-[4/5] w-16 overflow-hidden border transition-opacity duration-300 lg:w-full",
                  index === active ? "opacity-100" : "opacity-55 hover:opacity-100",
                )}
              >
                <Image src={image.url} alt="" fill sizes="80px" className="object-cover" />
                {index === active && (
                  // One marker that slides between thumbnails, so the change of
                  // photograph reads as movement rather than a flicker.
                  <motion.span
                    layoutId={`gallery-marker-${name}`}
                    aria-hidden
                    className="border-ink absolute inset-0 border-2"
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="border-line relative min-w-0 overflow-hidden border lg:h-full lg:flex-1">
        <div
          ref={trackRef}
          onScroll={handleTrackScroll}
          role="region"
          aria-roledescription="carousel"
          aria-label={`Photographs of ${name}`}
          // Focusable so arrow keys can step it: nothing inside is. The frame is
          // on the wrapper, and a 4px gap separates slides, so a sub-pixel
          // remainder at rest shows paper rather than a sliver of the last
          // photograph.
          tabIndex={0}
          className="flex snap-x snap-mandatory [scrollbar-width:none] gap-1 overflow-x-auto scroll-smooth lg:h-full [&::-webkit-scrollbar]:hidden"
        >
          {images.map((image, index) => (
            <div
              key={image.url}
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${count}`}
              className="bg-wash/40 relative aspect-[4/5] w-full shrink-0 snap-start lg:aspect-auto lg:h-full"
            >
              <Image
                src={image.url}
                alt={image.altText}
                fill
                sizes="(min-width: 1024px) 50vw, (min-width: 768px) 60vw, 100vw"
                // Only the first. Marking several defeats it and slows the one
                // that is actually the largest contentful paint.
                priority={index === 0}
                className="object-cover"
              />
            </div>
          ))}
        </div>

        {count > 1 && (
          <div className="absolute right-3 bottom-3 flex items-center gap-2">
            <span className="bg-paper/85 text-detail px-2 py-1 tabular-nums" aria-hidden>
              {active + 1} / {count}
            </span>
            <GalleryButton
              label="Previous photograph"
              disabled={active === 0}
              onClick={() => show(active - 1)}
            >
              <Chevron direction="left" />
            </GalleryButton>
            <GalleryButton
              label="Next photograph"
              disabled={active === count - 1}
              onClick={() => show(active + 1)}
            >
              <Chevron direction="right" />
            </GalleryButton>
          </div>
        )}
      </div>
    </div>
  );
}

function GalleryButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="bg-paper/85 hover:bg-paper text-ink flex size-10 items-center justify-center transition-colors disabled:cursor-default disabled:opacity-40"
    >
      {children}
    </button>
  );
}
