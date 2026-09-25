"use client";

import clsx from "clsx";
import { motion, useMotionValueEvent, useReducedMotion, useScroll } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { isHeaderHidden } from "@/components/layout/header-scroll";

/**
 * Sticky only on the way back up: the header slides away while the page
 * scrolls down and returns the moment it scrolls up.
 *
 * Only this frame is client code; the header's contents stay server-rendered
 * and arrive as children.
 *
 * It publishes its state as `data-header-hidden` on <html>, which moves
 * `--header-offset` in globals.css. Anything else sticky — the listing's filter
 * rail, the product gallery — sits at that offset and follows the header up and
 * down, rather than each one listening to the scroll itself.
 */
export function HeaderFrame({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollY } = useScroll();
  const reduceMotion = useReducedMotion();
  const [hidden, setHidden] = useState(false);
  const [atTop, setAtTop] = useState(true);

  useEffect(() => {
    document.documentElement.toggleAttribute("data-header-hidden", hidden);
  }, [hidden]);

  useMotionValueEvent(scrollY, "change", (y) => {
    const offset = ref.current?.offsetHeight ?? 0;
    setHidden((wasHidden) => isHeaderHidden(scrollY.getPrevious() ?? 0, y, wasHidden, offset));
    setAtTop(y <= 0);
  });

  return (
    <motion.header
      ref={ref}
      animate={{ y: hidden ? "-100%" : "0%" }}
      transition={reduceMotion ? { duration: 0 } : { duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      // A keyboard user tabbing into a hidden header must be able to see it.
      onFocusCapture={() => setHidden(false)}
      className={clsx(
        // A shadow, not a border, so the hairline adds no height: the home
        // hero sizes itself to the viewport minus exactly this header.
        "grain bg-paper sticky top-0 z-30 transition-shadow duration-300",
        !atTop && !hidden && "shadow-[0_1px_0_var(--line)]",
      )}
    >
      {children}
    </motion.header>
  );
}
