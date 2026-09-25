import Image from "next/image";
import Link from "next/link";

import { RailControls } from "@/components/home/RailControls";

/**
 * Placeholders until the merchant's photography exists. The API has no hero
 * image field, so these are repository assets: replacing one is a file in
 * `public/home/` and an `alt` describing the garment, because a real
 * photograph here is content rather than decoration.
 */
const SLIDES = [
  { src: "/home/placeholder-1.webp", alt: "" },
  { src: "/home/placeholder-2.webp", alt: "" },
  { src: "/home/placeholder-3.webp", alt: "" },
  { src: "/home/placeholder-4.webp", alt: "" },
];

const HEADLINE = ["New", "collection"];

/**
 * From `lg` the hero takes whatever height the viewport leaves under the intro,
 * and the slides size themselves from it: each is as large as fits both half
 * the rail's width and its full height, via container units on the rail.
 *
 * It is also capped at the height two full-width slides would have — the rail
 * is the 65.5% the design leaves beside its 407-of-1180 text column — so on a
 * tall screen the headline still starts level with the photographs' top edge,
 * as the design has it.
 */
export function Hero() {
  return (
    <section
      aria-labelledby="hero-title"
      className="mt-16 grid gap-8 lg:mt-[clamp(1.75rem,7svh,5.875rem)] lg:max-h-[calc((100cqw*0.655-42px)/2*375/365)] lg:min-h-0 lg:flex-1 lg:grid-cols-[34.5%_1fr] lg:gap-0"
    >
      <div className="flex flex-col justify-between gap-8 lg:pr-2.5">
        <div>
          <h1 id="hero-title" className="font-display text-poster font-black uppercase">
            {HEADLINE.map((line, index) => (
              <span key={line} className="block overflow-hidden pb-[0.06em]">
                <span
                  className="animate-rise block"
                  style={{ animationDelay: `${120 + index * 90}ms` }}
                >
                  {line}{" "}
                </span>
              </span>
            ))}
          </h1>
          <p
            className="animate-fade mt-[18px] text-[1.125rem] leading-6 tracking-[0.1em]"
            style={{ animationDelay: "380ms" }}
          >
            Summer
            <br />
            2024
          </p>
        </div>

        <div
          className="animate-fade flex items-center gap-6 xl:gap-10"
          style={{ animationDelay: "520ms" }}
        >
          <Link
            href="/products"
            className="group bg-wash hover:bg-ink hover:text-paper flex h-10 w-[265px] min-w-0 shrink items-center justify-between pr-5 pl-[27px] text-[1.1875rem] font-medium tracking-[-0.02em] transition-colors duration-300"
          >
            Go To Shop
            <svg
              aria-hidden
              viewBox="0 0 50 14"
              className="h-3.5 w-[50px] transition-transform duration-500 ease-(--ease-settle) group-hover:translate-x-1.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M1 7h47.5M42.5 13l6-6-6-6" />
            </svg>
          </Link>
          <RailControls target="hero-rail" className="hidden shrink-0 sm:flex" />
        </div>
      </div>

      <ul
        id="hero-rail"
        aria-label="New collection"
        // Focusable so a keyboard can scroll it: nothing inside is.
        tabIndex={0}
        className="flex snap-x snap-mandatory [scrollbar-width:none] gap-[42px] overflow-x-auto scroll-smooth lg:[container-type:size] lg:h-full lg:items-end [&::-webkit-scrollbar]:hidden"
      >
        {SLIDES.map((slide, index) => (
          <li
            key={slide.src}
            className="border-line animate-unveil relative aspect-[365/375] w-[80%] shrink-0 snap-start overflow-hidden border sm:w-[calc((100%-42px)/2)] lg:w-[min(calc((100cqw-42px)/2),calc(100cqh*365/375))]"
            style={{ animationDelay: `${index * 140}ms` }}
          >
            <Image
              src={slide.src}
              alt={slide.alt}
              fill
              priority={index === 0}
              sizes="(min-width: 1024px) 36vw, (min-width: 640px) 50vw, 80vw"
              className="animate-settle object-cover"
              style={{ animationDelay: `${index * 140}ms` }}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
