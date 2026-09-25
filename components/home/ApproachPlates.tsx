"use client";

import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";
import Image from "next/image";
import { useRef } from "react";

/**
 * Placeholders, like the hero's. Staggered and running off the right edge as the
 * design has them; the page clips the overflow.
 *
 * Each plate drifts against the scroll at its own rate, so the stagger opens and
 * closes as the section passes — depth from the layout the design already has,
 * rather than an effect added on top of it.
 */
const PLATES = [
  { src: "/home/placeholder-3.webp", aspect: "aspect-[316/388]", offset: "md:mt-0", drift: 30 },
  {
    src: "/home/placeholder-2.webp",
    aspect: "aspect-[316/418]",
    offset: "md:mt-[73px]",
    drift: 70,
  },
  { src: "/home/placeholder-1.webp", aspect: "aspect-[316/418]", offset: "md:mt-0", drift: 45 },
  {
    src: "/home/placeholder-4.webp",
    aspect: "aspect-[316/388]",
    offset: "md:mt-[103px]",
    drift: 90,
  },
];

export function ApproachPlates() {
  const ref = useRef<HTMLUListElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });

  return (
    <ul ref={ref} className="mt-16 flex items-start gap-4 md:mt-[110px] md:gap-[3.14%]">
      {PLATES.map((plate) => (
        <Plate
          key={plate.src}
          plate={plate}
          progress={scrollYProgress}
          drift={reduceMotion ? 0 : plate.drift}
        />
      ))}
    </ul>
  );
}

function Plate({
  plate,
  progress,
  drift,
}: {
  plate: (typeof PLATES)[number];
  progress: MotionValue<number>;
  drift: number;
}) {
  const y = useTransform(progress, [0, 1], [drift, -drift]);

  return (
    <motion.li
      style={{ y }}
      className={`border-line relative w-[45%] shrink-0 overflow-hidden border md:w-[26.8%] ${plate.aspect} ${plate.offset}`}
    >
      <Image
        src={plate.src}
        alt=""
        fill
        sizes="(min-width: 768px) 27vw, 45vw"
        className="object-cover"
      />
    </motion.li>
  );
}
