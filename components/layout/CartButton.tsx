"use client";

import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useRef, useState, type MouseEvent } from "react";

import { CartDrawer } from "@/components/cart/CartDrawer";
import { Sheet } from "@/components/ui/Sheet";

import { useCart } from "@/lib/cart/use-cart";

/**
 * The design's cart: a "Cart" pill with a ringed disc beside it. The disc shows
 * the unit count once there is one, and the bag glyph otherwise.
 *
 * Renders the glyph until the browser has read storage: the server has no
 * localStorage, so a count during SSR is a hydration mismatch and React discards
 * the server's markup for the whole header. The disc is a fixed size, so the
 * fill-in is not a layout shift either.
 *
 * It shows a count and never a total. ADR 0002 and ADR 0003 each forbid a money
 * figure here, for different reasons.
 *
 * A click opens the bag as a sheet from the right. It stays a link to /cart
 * underneath: without JavaScript, or with a modifier key or middle button, it
 * navigates as any link would, and only a plain click is taken over.
 */
export function CartButton() {
  const { count, ready } = useCart();
  const reduceMotion = useReducedMotion();
  const hasCount = ready && count > 0;
  const [open, setOpen] = useState(false);
  const linkRef = useRef<HTMLAnchorElement>(null);

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    event.preventDefault();
    setOpen(true);
  }

  return (
    <>
      <Link
        ref={linkRef}
        href="/cart"
        onClick={handleClick}
        aria-haspopup="dialog"
        className="group flex items-center"
      >
        <span
          aria-hidden
          className="bg-ink text-paper group-hover:bg-ink/85 hidden h-[50px] w-[76px] items-center justify-center rounded-[22px] pr-2 text-[0.875rem] font-medium tracking-[0.1em] transition-colors md:flex"
        >
          Cart
        </span>
        <span className="bg-ink relative flex size-[50px] items-center justify-center rounded-full md:-ml-[5px]">
          <span className="bg-paper text-ink flex size-[37px] items-center justify-center rounded-full text-[0.8125rem] font-semibold tabular-nums">
            {hasCount ? (
              // Keyed on the count, so an add re-mounts it and it pops once:
              // the only confirmation of an add that is visible from anywhere.
              <motion.span
                key={count}
                aria-hidden
                initial={reduceMotion ? false : { scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 520, damping: 22 }}
              >
                {count}
              </motion.span>
            ) : (
              <svg
                aria-hidden
                viewBox="0 0 16 16"
                className="size-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              >
                <path d="M3.5 5.5h9l-.8 7.5H4.3L3.5 5.5Z" strokeLinejoin="round" />
                <path d="M6 7.5c.3 1.2 1.1 2 2 2s1.7-.8 2-2" />
              </svg>
            )}
          </span>
        </span>
        {/* "Cart" is hidden with the pill on a phone, so the name lives here.
          Polite, because a cart change is worth hearing but not worth
          interrupting for. */}
        <span aria-live="polite" className="sr-only">
          {ready ? `Cart, ${count} ${count === 1 ? "item" : "items"}` : "Cart"}
        </span>
      </Link>
      <Sheet
        open={open}
        onOpenChange={setOpen}
        title={ready && count > 0 ? `Your bag (${count})` : "Your bag"}
        returnFocusRef={linkRef}
      >
        <CartDrawer onNavigate={() => setOpen(false)} />
      </Sheet>
    </>
  );
}
