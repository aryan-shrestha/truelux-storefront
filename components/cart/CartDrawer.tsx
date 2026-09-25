"use client";

import Link from "next/link";
import type { MouseEvent } from "react";

import { CartLine } from "@/components/cart/CartLine";
import { Skeleton } from "@/components/ui/Skeleton";
import { useCart } from "@/lib/cart/use-cart";
import { env } from "@/lib/env";

/**
 * The bag inside the sheet: its lines in their own scroll, and the way on to
 * checkout pinned below them so it never scrolls out of reach.
 *
 * The same states as the /cart page — not read yet, empty, lines — in a
 * layout for a 440px column rather than a page.
 */
export function CartDrawer({ onNavigate }: { onNavigate: () => void }) {
  const { lines, ready } = useCart();

  // Any link in the sheet leaves the page it was opened over, so the sheet
  // closes with it rather than staying open on the next page.
  function handleClickCapture(event: MouseEvent<HTMLDivElement>) {
    if (event.target instanceof Element && event.target.closest("a[href]")) onNavigate();
  }

  if (!ready) {
    return (
      <div className="flex flex-col gap-4 px-6 py-6" aria-busy>
        <span className="sr-only" role="status">
          Loading your bag
        </span>
        {[0, 1].map((line) => (
          <div key={line} className="flex gap-4">
            <Skeleton className="aspect-[4/5] w-24 shrink-0" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="flex flex-col gap-4 px-6 py-10" onClickCapture={handleClickCapture}>
        <p className="text-heading font-display font-semibold">Your bag is empty</p>
        <p className="prose-body text-slate">Nothing here yet.</p>
        <p>
          <Link href="/products" className="decoration-indigo underline underline-offset-4">
            Shop everything
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col" onClickCapture={handleClickCapture}>
      <ul className="scroll-quiet min-h-0 flex-1 px-6">
        {lines.map((line) => (
          <CartLine key={line.variantId} line={line} />
        ))}
      </ul>

      {/*
        No total, for the same two reasons as the /cart page: the storefront
        performs no arithmetic on money (ADR 0003), and the shipping fee depends
        on a district collected at checkout.
      */}
      <div className="border-line flex flex-col gap-3 border-t px-6 pt-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <p className="text-ui">Shipping and the total are confirmed at checkout.</p>
        <p className="text-detail text-slate">{env.shippingNote}</p>
        <Link
          href="/checkout"
          className="bg-ink text-paper hover:bg-ink/90 text-ui mt-2 inline-flex min-h-11 w-full items-center justify-center rounded-[2px] px-5 font-medium transition-colors"
        >
          Checkout
        </Link>
        <Link
          href="/cart"
          className="text-detail text-slate hover:text-ink self-center underline underline-offset-4"
        >
          View bag
        </Link>
      </div>
    </div>
  );
}
