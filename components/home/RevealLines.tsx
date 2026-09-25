"use client";

import { inView, stagger } from "motion";
import { useAnimate, useReducedMotion } from "motion/react";
import { useEffect, type ReactNode } from "react";

/**
 * A headline whose lines rise into place from behind their own baseline the
 * first time it scrolls into view. `trailing` rides on the last line, as the
 * count does on "New this week".
 *
 * Progressive by construction: the server renders the lines in place, and only
 * a headline that is below the fold when the page hydrates is hidden and
 * waiting. Without JavaScript, or with reduced motion, nothing moves and
 * nothing is ever hidden.
 */
export function RevealLines({ lines, trailing }: { lines: string[]; trailing?: ReactNode }) {
  const [scope, animate] = useAnimate<HTMLSpanElement>();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const element = scope.current;
    if (reduceMotion || element.getBoundingClientRect().top < window.innerHeight) return;

    const inner = element.querySelectorAll("[data-line]");
    animate(inner, { y: "105%" }, { duration: 0 });
    return inView(
      element,
      () => {
        animate(
          inner,
          { y: "0%" },
          { duration: 1, ease: [0.22, 1, 0.36, 1], delay: stagger(0.09) },
        );
      },
      { amount: 0.6 },
    );
  }, [animate, reduceMotion, scope]);

  return (
    <span ref={scope} className="block">
      {lines.map((line, index) => (
        <span key={line} className="block overflow-hidden pb-[0.06em]">
          {/* The trailing space keeps words apart in the accessible name,
              which does not insert one between block elements. */}
          <span data-line className="block">
            {line}
            {index === lines.length - 1 && trailing}{" "}
          </span>
        </span>
      ))}
    </span>
  );
}
